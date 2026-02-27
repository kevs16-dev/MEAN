const Shop = require('../model/boutique.model');
const User = require('../model/user.model');
const Product = require('../model/produit.model');
const ProductVariant = require('../model/produitVariant.model');

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Liste paginée et recherchable des produits d'une boutique (accès public client).
 * @param {string} shopId - ID de la boutique
 * @param {{ page?: number, limit?: number, search?: string }} options - page (défaut 1), limit (défaut 10), search (optionnel)
 * @returns {{ shop, products, total, page, limit, totalPages }}
 */
const getProductsByShopId = async (shopId, options = {}) => {
  const shop = await Shop.findById(shopId).populate('category', 'name');
  if (!shop) {
    throw new Error('Boutique non trouvée');
  }
  if (shop.status !== 'ACTIVE') {
    throw new Error('Boutique non disponible');
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const search = typeof options.search === 'string' ? options.search.trim() : '';

  const query = { shopId: shop._id, status: 'ACTIVE' };
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    query.$or = [
      { name: regex },
      { slug: regex },
      { description: regex }
    ];
  }

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(query)
  ]);

  return {
    shop: { _id: shop._id, name: shop.name, slug: shop.slug, category: shop.category },
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Produit + variantes d'une boutique (accès public client).
 * @param {string} shopId - ID de la boutique
 * @param {string} productId - ID du produit
 * @returns {{ product, variants, shop }}
 */
const getProductWithVariantsByShop = async (shopId, productId) => {
  const shop = await Shop.findById(shopId).populate('category', 'name');
  if (!shop) {
    throw new Error('Boutique non trouvée');
  }
  if (shop.status !== 'ACTIVE') {
    throw new Error('Boutique non disponible');
  }

  const product = await Product.findOne({ _id: productId, shopId: shop._id }).lean();
  if (!product) {
    throw new Error('Produit non trouvé');
  }
  if (product.status !== 'ACTIVE') {
    throw new Error('Produit non disponible');
  }

  const variants = await ProductVariant.find({ productId: product._id, isActive: true }).lean();
  return {
    product,
    variants,
    shop: { _id: shop._id, name: shop.name, slug: shop.slug }
  };
};

const createShop = async (shopData) => {
    return await Shop.create(shopData);
};

const getAllShops = async () => {
    return await Shop.find().populate('category', 'name').populate('createdBy', 'username');
};

const getShopById = async (id) => {
    return await Shop.findById(id).populate('category', 'name').populate('createdBy', 'username');
};

const getShopsAvailableForBoutique = async (editingUserId = null) => {
    const linked = await User.find({ role: 'BOUTIQUE', shopId: { $ne: null } })
        .select('shopId _id')
        .lean();
    const editingShopId = editingUserId
        ? (await User.findById(editingUserId).select('shopId').lean())?.shopId?.toString()
        : null;
    const linkedShopIds = linked
        .filter((u) => u.shopId && (u._id.toString() !== editingUserId))
        .map((u) => u.shopId.toString());
    return Shop.find({
        _id: { $nin: linkedShopIds },
        status: 'ACTIVE'
    })
        .select('name slug')
        .sort({ name: 1 });
};

const deleteShop = async (shopId) => {
    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw new Error('Boutique non trouvée');
    }

    await User.deleteMany({
        role: 'BOUTIQUE',
        shopId: shopId
    });

    await Shop.findByIdAndDelete(shopId);
};

module.exports = {
    createShop,
    getAllShops,
    getShopById,
    getShopsAvailableForBoutique,
    getProductsByShopId,
    getProductWithVariantsByShop,
    deleteShop
};