const mongoose = require('mongoose');
const Cart = require('../model/cart.model');
const Order = require('../model/order.model');
const Product = require('../model/produit.model');
const ProductVariant = require('../model/produitVariant.model');
const Shop = require('../model/boutique.model');
const User = require('../model/user.model');
const Notification = require('../model/notification.model');

const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
};

const toPositiveInt = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
};

const getAvailableStock = (variant) => {
  const stock = Number(variant?.stock) || 0;
  const reserved = Number(variant?.reservedStock) || 0;
  return Math.max(0, stock - reserved);
};

const notifyShopUsersForNewOrder = async (shopId, order, session) => {
  const users = await User.find({
    role: 'BOUTIQUE',
    shopId,
    isActive: true
  })
    .select('_id')
    .session(session);

  if (!users.length) return;

  const shortId = String(order._id).slice(-8);
  const notifications = users.map((user) => ({
    userId: user._id,
    title: 'Nouvelle commande reçue',
    message: `Une nouvelle commande (#${shortId}) a été reçue dans votre boutique.`,
    type: 'INFO',
    isRead: false
  }));

  await Notification.insertMany(notifications, { session });
};

const notifyClientForOrderStatus = async (order, status, session) => {
  const shortId = String(order._id).slice(-8);
  const isConfirmed = status === ORDER_STATUS.CONFIRMED;

  await Notification.create(
    [
      {
        userId: order.userId,
        title: isConfirmed ? 'Commande confirmée' : 'Commande rejetée',
        message: isConfirmed
          ? `Votre commande #${shortId} a été confirmée par la boutique.`
          : `Votre commande #${shortId} a été rejetée par la boutique.`,
        type: isConfirmed ? 'SUCCESS' : 'WARNING',
        isRead: false
      }
    ],
    { session }
  );
};

const getBoutiqueUserShopId = async (userId) => {
  const boutiqueUser = await User.findById(userId).select('role shopId');
  if (!boutiqueUser || boutiqueUser.role !== 'BOUTIQUE') {
    const err = new Error('Accès interdit');
    err.status = 403;
    throw err;
  }

  if (!boutiqueUser.shopId) {
    const err = new Error('Aucune boutique associée à cet utilisateur');
    err.status = 400;
    throw err;
  }

  return boutiqueUser.shopId;
};

const createOrdersFromCart = async (clientUserId) => {
  const session = await mongoose.startSession();
  let createdOrders = [];

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId: clientUserId }).session(session);
      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        const err = new Error('Panier vide');
        err.status = 400;
        throw err;
      }

      const groupedByShop = new Map();

      for (const item of cart.items) {
        const variant = await ProductVariant.findById(item.productVariantId).session(session);
        if (!variant || !variant.isActive) {
          const err = new Error('Une ou plusieurs variantes sont indisponibles');
          err.status = 400;
          throw err;
        }

        const product = await Product.findById(variant.productId).session(session);
        if (!product) {
          const err = new Error('Produit introuvable pour une variante du panier');
          err.status = 400;
          throw err;
        }

        const shop = await Shop.findById(product.shopId).session(session);
        if (!shop || shop.status !== 'ACTIVE') {
          const err = new Error(`La boutique "${shop?.name || 'inconnue'}" n'est pas disponible`);
          err.status = 400;
          throw err;
        }

        const availableStock = getAvailableStock(variant);
        if (item.quantity > availableStock) {
          const err = new Error(
            `Stock insuffisant pour "${product.name}" (disponible: ${availableStock})`
          );
          err.status = 400;
          throw err;
        }

        variant.reservedStock = (Number(variant.reservedStock) || 0) + item.quantity;
        await variant.save({ session });

        const shopKey = String(shop._id);
        if (!groupedByShop.has(shopKey)) {
          groupedByShop.set(shopKey, {
            shopId: shop._id,
            items: [],
            totalAmount: 0
          });
        }

        const group = groupedByShop.get(shopKey);
        group.items.push({
          productVariantId: variant._id,
          nameSnapshot: product.name,
          priceSnapshot: variant.currentPrice,
          quantity: item.quantity
        });
        group.totalAmount += (Number(variant.currentPrice) || 0) * (Number(item.quantity) || 0);
      }

      for (const group of groupedByShop.values()) {
        const order = await Order.create(
          [
            {
              userId: clientUserId,
              shopId: group.shopId,
              items: group.items,
              totalAmount: group.totalAmount,
              status: ORDER_STATUS.PENDING,
              paymentStatus: 'PENDING'
            }
          ],
          { session }
        );

        createdOrders.push(order[0]);
      }

      await Cart.findOneAndDelete({ userId: clientUserId }).session(session);

      for (const order of createdOrders) {
        await notifyShopUsersForNewOrder(order.shopId, order, session);
      }
    });

    createdOrders = await Order.find({ _id: { $in: createdOrders.map((o) => o._id) } })
      .populate('shopId', 'name')
      .sort({ createdAt: -1 });

    return createdOrders;
  } finally {
    session.endSession();
  }
};

const getMyOrders = async (clientUserId, { page = 1, limit = 10 } = {}) => {
  const safePage = toPositiveInt(page, 1);
  const safeLimit = Math.min(toPositiveInt(limit, 10), 100);
  const skip = (safePage - 1) * safeLimit;

  const query = { userId: clientUserId };
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('shopId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit))
  };
};

const getMyOrderById = async (clientUserId, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId: clientUserId })
    .populate('shopId', 'name');

  if (!order) {
    const err = new Error('Commande introuvable');
    err.status = 404;
    throw err;
  }

  return order;
};

const getShopOrders = async (boutiqueUserId, { page = 1, limit = 10, status } = {}) => {
  const shopId = await getBoutiqueUserShopId(boutiqueUserId);
  const safePage = toPositiveInt(page, 1);
  const safeLimit = Math.min(toPositiveInt(limit, 10), 100);
  const skip = (safePage - 1) * safeLimit;

  const query = { shopId };
  if (status && String(status).trim()) {
    query.status = String(status).trim();
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('userId', 'nom prenom username email telephone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit))
  };
};

const getShopOrderById = async (boutiqueUserId, orderId) => {
  const shopId = await getBoutiqueUserShopId(boutiqueUserId);
  const order = await Order.findOne({ _id: orderId, shopId })
    .populate('userId', 'nom prenom username email telephone');

  if (!order) {
    const err = new Error('Commande introuvable');
    err.status = 404;
    throw err;
  }

  return order;
};

const updateOrderStatusForShop = async (boutiqueUserId, orderId, targetStatus) => {
  const shopId = await getBoutiqueUserShopId(boutiqueUserId);
  const session = await mongoose.startSession();
  let updatedOrder = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, shopId }).session(session);
      if (!order) {
        const err = new Error('Commande introuvable');
        err.status = 404;
        throw err;
      }

      if (order.status !== ORDER_STATUS.PENDING) {
        const err = new Error('Seules les commandes en attente peuvent être modifiées');
        err.status = 400;
        throw err;
      }

      for (const item of order.items) {
        const variant = await ProductVariant.findById(item.productVariantId).session(session);
        if (!variant) {
          const err = new Error('Une variante de la commande est introuvable');
          err.status = 400;
          throw err;
        }

        const qty = Number(item.quantity) || 0;
        if (qty <= 0) continue;

        if ((Number(variant.reservedStock) || 0) < qty) {
          const err = new Error('Stock réservé incohérent pour la commande');
          err.status = 400;
          throw err;
        }

        if (targetStatus === ORDER_STATUS.CONFIRMED) {
          if ((Number(variant.stock) || 0) < qty) {
            const err = new Error('Stock insuffisant pour confirmer la commande');
            err.status = 400;
            throw err;
          }

          variant.stock = (Number(variant.stock) || 0) - qty;
          variant.reservedStock = (Number(variant.reservedStock) || 0) - qty;
          variant.soldCount = (Number(variant.soldCount) || 0) + qty;
        } else if (targetStatus === ORDER_STATUS.CANCELLED) {
          variant.reservedStock = (Number(variant.reservedStock) || 0) - qty;
        }

        await variant.save({ session });
      }

      order.status = targetStatus;
      await order.save({ session });
      updatedOrder = order;

      await notifyClientForOrderStatus(order, targetStatus, session);
    });

    return await Order.findById(updatedOrder._id)
      .populate('userId', 'nom prenom username email telephone');
  } finally {
    session.endSession();
  }
};

const confirmOrder = async (boutiqueUserId, orderId) => {
  return updateOrderStatusForShop(boutiqueUserId, orderId, ORDER_STATUS.CONFIRMED);
};

const rejectOrder = async (boutiqueUserId, orderId) => {
  return updateOrderStatusForShop(boutiqueUserId, orderId, ORDER_STATUS.CANCELLED);
};

module.exports = {
  createOrdersFromCart,
  getMyOrders,
  getMyOrderById,
  getShopOrders,
  getShopOrderById,
  confirmOrder,
  rejectOrder
};
