const mongoose = require('mongoose');
const Cart = require('../model/cart.model');
const ProductVariant = require('../model/produitVariant.model');
const Product = require('../model/produit.model');
const Shop = require('../model/boutique.model');

/** Normalise userId pour la requête (string ou ObjectId) */
const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  return null;
};

/**
 * Stock disponible pour le CLIENT = stock réel - stock réservé
 * @param {object} variant - Variante avec stock et reservedStock
 * @returns {number}
 */
const getAvailableStock = (variant) => {
  const stock = Number(variant?.stock) || 0;
  const reserved = Number(variant?.reservedStock) || 0;
  return Math.max(0, stock - reserved);
};

/**
 * Récupère ou crée le panier du CLIENT avec les items enrichis (variante, produit, boutique)
 * @param {string} userId - ID utilisateur CLIENT
 * @returns {object} Panier avec items enrichis et total d'articles
 */
const getCart = async (userId) => {
  const uid = toObjectId(userId);
  if (!uid) return { _id: null, items: [], totalItems: 0 };
  let cart = await Cart.findOne({ userId: uid }).lean();
  if (!cart) {
    cart = { items: [] };
  }

  if (!cart.items || cart.items.length === 0) {
    return {
      _id: cart._id || null,
      items: [],
      totalItems: 0
    };
  }

  const enrichedItems = [];
  const variantId = (id) => {
    if (!id) return null;
    if (id instanceof mongoose.Types.ObjectId) return id;
    if (typeof id === 'object' && id.$oid) return new mongoose.Types.ObjectId(id.$oid);
    if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
    return null;
  };

  for (const item of cart.items) {
    const vid = variantId(item.productVariantId);
    if (!vid) continue;

    const variant = await ProductVariant.findById(vid)
      .populate('productId', 'name slug shopId')
      .lean();
    if (!variant || !variant.isActive) continue;

    const product = variant.productId;
    if (!product || !product.shopId) continue;

    const shop = await Shop.findById(product.shopId).select('name _id status logo').lean();
    if (!shop) continue;
    // Inclure les items même si shop non ACTIVE (affichage panier), la commande validera côté order

    const availableStock = getAvailableStock(variant);
    enrichedItems.push({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      variant: {
        _id: variant._id,
        sku: variant.sku,
        attributes: variant.attributes || [],
        currentPrice: variant.currentPrice,
        stock: variant.stock,
        reservedStock: variant.reservedStock,
        availableStock,
        imageUrl: variant.imageUrl || null
      },
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug
      },
      shop: {
        _id: shop._id,
        name: shop.name,
        logo: shop.logo || null
      },
      subtotal: variant.currentPrice * item.quantity
    });
  }

  const totalItems = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);

  return {
    _id: cart._id,
    items: enrichedItems,
    totalItems
  };
};

/**
 * Ajoute une variante au panier (ou cumule si déjà présente)
 * @param {string} userId - ID utilisateur CLIENT
 * @param {string} productVariantId - ID variante
 * @param {number} quantity - Quantité à ajouter
 */
const addItem = async (userId, productVariantId, quantity) => {
  const uid = toObjectId(userId);
  if (!uid) throw new Error('Utilisateur invalide');
  const qty = Math.max(1, Math.floor(Number(quantity) || 0));
  const variant = await ProductVariant.findById(productVariantId).lean();
  if (!variant) {
    throw new Error('Variante non trouvée');
  }
  if (!variant.isActive) {
    throw new Error('Variante non disponible');
  }
  const availableStock = getAvailableStock(variant);
  if (availableStock < 1) {
    throw new Error('Stock insuffisant pour cette variante');
  }

  let cart = await Cart.findOne({ userId: uid });
  if (!cart) {
    cart = await Cart.create({ userId: uid, items: [] });
  }

  const existingIdx = cart.items.findIndex(
    (i) => i.productVariantId?.toString() === productVariantId
  );
  const currentQty = existingIdx >= 0 ? cart.items[existingIdx].quantity : 0;
  const newQty = currentQty + qty;

  if (newQty > availableStock) {
    throw new Error(
      `Stock disponible insuffisant (max: ${availableStock}). Vous avez déjà ${currentQty} dans le panier.`
    );
  }

  if (existingIdx >= 0) {
    cart.items[existingIdx].quantity = newQty;
  } else {
    cart.items.push({ productVariantId, quantity: newQty });
  }
  await cart.save();

  return getCart(userId);
};

/**
 * Modifie la quantité d'une variante dans le panier
 * Si quantité = 0, supprime l'article
 * @param {string} userId - ID utilisateur CLIENT
 * @param {string} productVariantId - ID variante
 * @param {number} quantity - Nouvelle quantité
 */
const updateItemQuantity = async (userId, productVariantId, quantity) => {
  const uid = toObjectId(userId);
  if (!uid) throw new Error('Utilisateur invalide');
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));

  const cart = await Cart.findOne({ userId: uid });
  if (!cart) {
    throw new Error('Panier vide');
  }

  const idx = cart.items.findIndex(
    (i) => i.productVariantId?.toString() === productVariantId
  );
  if (idx < 0) {
    throw new Error('Article non trouvé dans le panier');
  }

  if (qty === 0) {
    cart.items.splice(idx, 1);
    await cart.save();
    return getCart(userId);
  }

  const variant = await ProductVariant.findById(productVariantId).lean();
  if (!variant || !variant.isActive) {
    throw new Error('Variante non disponible');
  }
  const availableStock = getAvailableStock(variant);
  if (qty > availableStock) {
    throw new Error(`Stock disponible insuffisant (max: ${availableStock})`);
  }

  cart.items[idx].quantity = qty;
  await cart.save();

  return getCart(userId);
};

/**
 * Supprime une variante du panier
 * @param {string} userId - ID utilisateur CLIENT
 * @param {string} productVariantId - ID variante
 */
const removeItem = async (userId, productVariantId) => {
  const uid = toObjectId(userId);
  if (!uid) return { _id: null, items: [], totalItems: 0 };
  const cart = await Cart.findOne({ userId: uid });
  if (!cart) {
    return getCart(userId);
  }

  const idx = cart.items.findIndex(
    (i) => i.productVariantId?.toString() === productVariantId
  );
  if (idx >= 0) {
    cart.items.splice(idx, 1);
    await cart.save();
  }

  return getCart(userId);
};

/**
 * Vide le panier du CLIENT
 * @param {string} userId - ID utilisateur CLIENT
 */
const clearCart = async (userId) => {
  const uid = toObjectId(userId);
  if (!uid) return { _id: null, items: [], totalItems: 0 };
  await Cart.findOneAndDelete({ userId: uid });
  return { _id: null, items: [], totalItems: 0 };
};

/**
 * Retourne le nombre total d'articles dans le panier (pour badge navbar)
 * @param {string} userId - ID utilisateur CLIENT
 * @returns {number}
 */
const getCartCount = async (userId) => {
  const uid = toObjectId(userId);
  if (!uid) return 0;
  const cart = await Cart.findOne({ userId: uid }).lean();
  if (!cart || !cart.items || cart.items.length === 0) {
    return 0;
  }
  return cart.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
};

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  getCartCount,
  getAvailableStock
};
