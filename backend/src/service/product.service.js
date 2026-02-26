const Product = require('../model/produit.model');
const ProductVariant = require('../model/produitVariant.model');
const Shop = require('../model/boutique.model');
const User = require('../model/user.model');
const AppError = require('../utils/AppError');

const getShopForUserBoutique = async (userId) => {
  const user = await User.findById(userId).select('shopId role');
  if (!user || user.role !== 'BOUTIQUE') {
    throw new AppError('USER_NOT_BOUTIQUE', 403);
  }

  if (user.shopId) {
    const shop = await Shop.findOne({ _id: user.shopId, status: 'ACTIVE' });
    if (!shop) {
      throw new AppError('NO_ACTIVE_SHOP_FOR_USER', 400);
    }
    return shop;
  }

  const fallbackShop = await Shop.findOne({ createdBy: userId, status: 'ACTIVE' });
  if (!fallbackShop) {
    throw new AppError('NO_ACTIVE_SHOP_FOR_USER', 400);
  }
  return fallbackShop;
};

/** Au moins un attribut avec nom et valeur renseignés */
const hasAtLeastOneAttribute = (attributes) => {
  if (!Array.isArray(attributes) || attributes.length === 0) return false;
  return attributes.some((a) => a && String(a.name || '').trim() && String(a.value || '').trim());
};

const buildAttributesKey = (attributes) => {
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return '';
  }

  return attributes
    .filter((att) => att && typeof att.name === 'string')
    .map((att) => ({
      name: String(att.name).trim().toLowerCase(),
      value: att.value == null ? '' : String(att.value).trim().toLowerCase()
    }))
    .sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;
      return 0;
    })
    .map((att) => `${att.name}=${att.value}`)
    .join('|');
};

/**
 * Liste paginée et recherchable des produits de ma boutique.
 * @param {string} userId
 * @param {{ page?: number, limit?: number, search?: string }} options - page (défaut 1), limit (défaut 10), search (optionnel)
 * @returns {{ products, total, page, limit, totalPages }}
 */
const getMyProducts = async (userId, options = {}) => {
  const shop = await getShopForUserBoutique(userId);
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const search = typeof options.search === 'string' ? options.search.trim() : '';

  const query = { shopId: shop._id };
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
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const createProductForMyShop = async (userId, productData) => {
  const shop = await getShopForUserBoutique(userId);

  const data = {
    ...productData,
    shopId: shop._id
  };
  delete data.category;

  if (!data.slug && data.name) {
    data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
  }

  return Product.create(data);
};

const getMyProductById = async (userId, productId) => {
  const shop = await getShopForUserBoutique(userId);
  const product = await Product.findOne({ _id: productId, shopId: shop._id });
  if (!product) {
    throw new AppError('PRODUCT_NOT_FOUND', 404);
  }
  return product;
};

/** Produit + toutes ses variantes pour la page détail */
const getMyProductWithVariants = async (userId, productId) => {
  const product = await getMyProductById(userId, productId);
  const variants = await ProductVariant.find({ productId: product._id }).lean();
  return { product, variants };
};

const updateMyProduct = async (userId, productId, updateData) => {
  const shop = await getShopForUserBoutique(userId);

  delete updateData.category;
  if (updateData.name && !updateData.slug) {
    updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, '-');
  }

  const product = await Product.findOneAndUpdate(
    { _id: productId, shopId: shop._id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError('PRODUCT_NOT_FOUND', 404);
  }

  return product;
};

const deleteMyProduct = async (userId, productId) => {
  const shop = await getShopForUserBoutique(userId);

  const product = await Product.findOneAndDelete({ _id: productId, shopId: shop._id });

  if (!product) {
    throw new AppError('PRODUCT_NOT_FOUND', 404);
  }

  await ProductVariant.deleteMany({ productId: product._id });

  return product;
};

const getVariantsForMyProduct = async (userId, productId) => {
  const product = await getMyProductById(userId, productId);
  return ProductVariant.find({ productId: product._id });
};

const createVariantForMyProduct = async (userId, productId, variantData) => {
  const product = await getMyProductById(userId, productId);

  const data = {
    ...variantData,
    productId: product._id
  };
  delete data.sku; /* SKU généré automatiquement par le modèle */

  if (!hasAtLeastOneAttribute(data.attributes)) {
    throw new AppError('VARIANT_ATTRIBUTES_REQUIRED', 400);
  }

  const newKey = buildAttributesKey(data.attributes);
  if (newKey) {
    const existingVariants = await ProductVariant.find({ productId: product._id });
    const hasDuplicate = existingVariants.some(
      (v) => buildAttributesKey(v.attributes) === newKey
    );

    if (hasDuplicate) {
      throw new AppError('VARIANT_ALREADY_EXISTS', 400);
    }
  }

  if (!data.priceHistory || data.priceHistory.length === 0) {
    data.priceHistory = [
      {
        price: data.currentPrice,
        startDate: new Date(),
        reason: 'NORMAL'
      }
    ];
  }

  return ProductVariant.create(data);
};

const updateVariantForMyProduct = async (userId, productId, variantId, updateData) => {
  const product = await getMyProductById(userId, productId);

  const variant = await ProductVariant.findOne({ _id: variantId, productId: product._id });
  if (!variant) {
    throw new AppError('VARIANT_NOT_FOUND', 404);
  }

  const nextAttributes = Array.isArray(updateData.attributes)
    ? updateData.attributes
    : variant.attributes;

  const newKey = buildAttributesKey(nextAttributes);
  if (newKey) {
    const siblings = await ProductVariant.find({
      _id: { $ne: variantId },
      productId: product._id
    });

    const hasDuplicate = siblings.some(
      (v) => buildAttributesKey(v.attributes) === newKey
    );

    if (hasDuplicate) {
      throw new AppError('VARIANT_ALREADY_EXISTS', 400);
    }
  }

  if (
    updateData.currentPrice !== undefined &&
    updateData.currentPrice !== variant.currentPrice
  ) {
    variant.priceHistory.push({
      price: updateData.currentPrice,
      startDate: new Date(),
      reason: updateData.priceChangeReason || 'NORMAL'
    });
  }

  if (Array.isArray(updateData.attributes)) {
    if (!hasAtLeastOneAttribute(updateData.attributes)) {
      throw new AppError('VARIANT_ATTRIBUTES_REQUIRED', 400);
    }
    variant.attributes = updateData.attributes;
    delete updateData.attributes;
  }

  /* Image facultative : simple URL (lien Google Drive ou autre) */
  if (updateData.imageUrl !== undefined) {
    variant.imageUrl = updateData.imageUrl && String(updateData.imageUrl).trim() ? updateData.imageUrl.trim() : undefined;
    delete updateData.imageUrl;
  }

  delete updateData.sku; /* SKU non modifiable (géré automatiquement à la création) */

  /* Ne copier que les champs autorisés pour éviter de polluer le document (ex. "next" depuis req.body) */
  if (updateData.currentPrice !== undefined) variant.currentPrice = updateData.currentPrice;
  if (updateData.stock !== undefined) variant.stock = updateData.stock;
  if (updateData.lowStockAlertThreshold !== undefined) variant.lowStockAlertThreshold = updateData.lowStockAlertThreshold;
  if (updateData.isActive !== undefined) variant.isActive = updateData.isActive;

  await variant.save();

  return variant;
};

const deleteVariantForMyProduct = async (userId, productId, variantId) => {
  const product = await getMyProductById(userId, productId);

  const variant = await ProductVariant.findOneAndDelete({
    _id: variantId,
    productId: product._id
  });

  if (!variant) {
    throw new AppError('VARIANT_NOT_FOUND', 404);
  }

  return variant;
};

module.exports = {
  getMyProducts,
  createProductForMyShop,
  getMyProductById,
  getMyProductWithVariants,
  updateMyProduct,
  deleteMyProduct,
  getVariantsForMyProduct,
  createVariantForMyProduct,
  updateVariantForMyProduct,
  deleteVariantForMyProduct
};

