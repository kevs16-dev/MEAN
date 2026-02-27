const mongoose = require('mongoose');
const Order = require('../model/order.model');
const Cart = require('../model/cart.model');
const ProductVariant = require('../model/produitVariant.model');
const Product = require('../model/produit.model');
const Shop = require('../model/boutique.model');
const User = require('../model/user.model');
const { getAvailableStock } = require('./cart.service');

/**
 * Récupère la boutique du user BOUTIQUE
 * @param {string} userId - ID utilisateur BOUTIQUE
 * @returns {Promise<object>}
 */
const getShopForBoutiqueUser = async (userId) => {
  const user = await User.findById(userId).select('shopId role').lean();
  if (!user || user.role !== 'BOUTIQUE') {
    throw new Error('Utilisateur BOUTIQUE non trouvé');
  }
  if (!user.shopId) {
    throw new Error('Aucune boutique associée');
  }
  const shop = await Shop.findOne({ _id: user.shopId, status: 'ACTIVE' }).lean();
  if (!shop) {
    throw new Error('Boutique non disponible');
  }
  return shop;
};

/**
 * Génère le nameSnapshot (nom produit + attributs variante)
 * @param {object} product - Produit avec name
 * @param {object} variant - Variante avec attributes
 * @returns {string}
 */
const buildNameSnapshot = (product, variant) => {
  const name = product?.name || 'Produit';
  const attrs = (variant?.attributes || [])
    .map((a) => `${a.name}: ${a.value}`)
    .join(', ');
  return attrs ? `${name} (${attrs})` : name;
};

/**
 * Crée les commandes à partir du panier du CLIENT.
 * - Groupe les items par boutique
 * - Une commande par boutique
 * - Incrémente reservedStock pour chaque variante
 * - Vide le panier des articles commandés
 * @param {string} userId - ID utilisateur CLIENT
 * @returns {{ orders: object[] }}
 */
const createOrdersFromCart = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new Error('Panier vide');
  }

  const itemsWithDetails = [];
  for (const item of cart.items) {
    const variant = await ProductVariant.findById(item.productVariantId)
      .populate('productId', 'name shopId')
      .lean();
    if (!variant || !variant.isActive) continue;

    const product = variant.productId;
    if (!product) continue;

    const shop = await Shop.findById(product.shopId).lean();
    if (!shop || shop.status !== 'ACTIVE') continue;

    const availableStock = getAvailableStock(variant);
    if (availableStock < item.quantity) {
      throw new Error(
        `Stock insuffisant pour "${buildNameSnapshot(product, variant)}" (demandé: ${item.quantity}, disponible: ${availableStock})`
      );
    }

    itemsWithDetails.push({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      nameSnapshot: buildNameSnapshot(product, variant),
      priceSnapshot: variant.currentPrice,
      shopId: shop._id
    });
  }

  if (itemsWithDetails.length === 0) {
    throw new Error('Aucun article valide dans le panier');
  }

  const byShop = {};
  for (const it of itemsWithDetails) {
    const sid = it.shopId.toString();
    if (!byShop[sid]) byShop[sid] = [];
    byShop[sid].push(it);
  }

  const session = await mongoose.startSession();
  await session.startTransaction();

  try {
    const createdOrders = [];

    for (const shopId of Object.keys(byShop)) {
      const items = byShop[shopId];
      let totalAmount = 0;
      const orderItems = items.map((it) => {
        totalAmount += it.priceSnapshot * it.quantity;
        return {
          productVariantId: it.productVariantId,
          nameSnapshot: it.nameSnapshot,
          priceSnapshot: it.priceSnapshot,
          quantity: it.quantity
        };
      });

      const order = await Order.create(
        [
          {
            userId,
            shopId,
            items: orderItems,
            totalAmount,
            status: 'PENDING',
            paymentStatus: 'PENDING'
          }
        ],
        { session }
      );
      createdOrders.push(order[0]);

      for (const it of items) {
        await ProductVariant.findByIdAndUpdate(
          it.productVariantId,
          { $inc: { reservedStock: it.quantity } },
          { session }
        );
      }
    }

    const variantIdsToRemove = itemsWithDetails.map((i) => i.productVariantId);
    cart.items = cart.items.filter(
      (i) => !variantIdsToRemove.some((vid) => vid.toString() === i.productVariantId.toString())
    );
    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id, { session });
    } else {
      await cart.save({ session });
    }

    await session.commitTransaction();

    const populated = await Order.find({ _id: { $in: createdOrders.map((o) => o._id) } })
      .populate('shopId', 'name')
      .lean();

    return { orders: populated };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Liste des commandes du CLIENT connecté
 * @param {string} userId - ID utilisateur CLIENT
 * @param {{ page?: number, limit?: number }} options
 */
const getMyOrders = async (userId, options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ userId })
      .populate('shopId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ userId })
  ]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Détail d'une commande (CLIENT : uniquement ses commandes)
 * @param {string} userId - ID utilisateur CLIENT
 * @param {string} orderId - ID commande
 */
const getOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId })
    .populate('shopId', 'name slug')
    .populate('items.productVariantId', 'sku attributes')
    .lean();

  if (!order) {
    throw new Error('Commande non trouvée');
  }

  return order;
};

/**
 * Liste des commandes de la boutique du BOUTIQUE connecté
 * @param {string} boutiqueUserId - ID utilisateur BOUTIQUE
 * @param {{ page?: number, limit?: number, status?: string }} options
 */
const getShopOrders = async (boutiqueUserId, options = {}) => {
  const shop = await getShopForBoutiqueUser(boutiqueUserId);
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  const status = typeof options.status === 'string' && options.status.trim()
    ? options.status.trim()
    : null;
  const skip = (page - 1) * limit;

  const query = { shopId: shop._id };
  if (status) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('userId', 'username nom prenom email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Détail d'une commande pour la BOUTIQUE (commande liée à sa boutique)
 * @param {string} boutiqueUserId - ID utilisateur BOUTIQUE
 * @param {string} orderId - ID commande
 */
const getShopOrderById = async (boutiqueUserId, orderId) => {
  const shop = await getShopForBoutiqueUser(boutiqueUserId);
  const order = await Order.findOne({ _id: orderId, shopId: shop._id })
    .populate('userId', 'username nom prenom email telephone')
    .populate('items.productVariantId', 'sku attributes')
    .lean();

  if (!order) {
    throw new Error('Commande non trouvée');
  }

  return order;
};

/**
 * Confirme une commande par la BOUTIQUE.
 * Diminue stock réel, diminue reservedStock, augmente soldCount pour chaque variante.
 * @param {string} boutiqueUserId - ID utilisateur BOUTIQUE
 * @param {string} orderId - ID commande
 */
const confirmOrder = async (boutiqueUserId, orderId) => {
  const shop = await getShopForBoutiqueUser(boutiqueUserId);
  const order = await Order.findOne({ _id: orderId, shopId: shop._id });
  if (!order) {
    throw new Error('Commande non trouvée');
  }
  if (order.status !== 'PENDING') {
    throw new Error('Cette commande ne peut plus être confirmée');
  }

  const session = await mongoose.startSession();
  await session.startTransaction();

  try {
    for (const item of order.items) {
      const variant = await ProductVariant.findById(item.productVariantId).session(session);
      if (!variant) {
        throw new Error(`Variante non trouvée: ${item.productVariantId}`);
      }
      const qty = item.quantity || 0;
      if (variant.reservedStock < qty) {
        throw new Error(`Stock réservé insuffisant pour "${item.nameSnapshot}"`);
      }
      if (variant.stock < qty) {
        throw new Error(`Stock insuffisant pour "${item.nameSnapshot}" (demandé: ${qty}, disponible: ${variant.stock})`);
      }
      variant.stock -= qty;
      variant.reservedStock -= qty;
      variant.soldCount += qty;
      await variant.save({ session });
    }

    order.status = 'CONFIRMED';
    await order.save({ session });

    await session.commitTransaction();
    return Order.findById(orderId).populate('shopId', 'name').populate('userId', 'username nom prenom').lean();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Rejette une commande par la BOUTIQUE.
 * Libère le reservedStock pour chaque variante.
 * @param {string} boutiqueUserId - ID utilisateur BOUTIQUE
 * @param {string} orderId - ID commande
 */
const rejectOrder = async (boutiqueUserId, orderId) => {
  const shop = await getShopForBoutiqueUser(boutiqueUserId);
  const order = await Order.findOne({ _id: orderId, shopId: shop._id });
  if (!order) {
    throw new Error('Commande non trouvée');
  }
  if (order.status !== 'PENDING') {
    throw new Error('Cette commande ne peut plus être rejetée');
  }

  const session = await mongoose.startSession();
  await session.startTransaction();

  try {
    for (const item of order.items) {
      const qty = item.quantity || 0;
      await ProductVariant.findByIdAndUpdate(
        item.productVariantId,
        { $inc: { reservedStock: -qty } },
        { session }
      );
    }

    order.status = 'CANCELLED';
    await order.save({ session });

    await session.commitTransaction();
    return Order.findById(orderId).populate('shopId', 'name').populate('userId', 'username nom prenom').lean();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createOrdersFromCart,
  getMyOrders,
  getOrderById,
  getShopOrders,
  getShopOrderById,
  confirmOrder,
  rejectOrder
};
