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

const getMyProducts = async (userId) => {
  const shop = await getShopForUserBoutique(userId);
  return Product.find({ shopId: shop._id });
};

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
    variant.attributes = updateData.attributes;
    delete updateData.attributes;
  }

  Object.assign(variant, updateData);

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
  updateMyProduct,
  deleteMyProduct,
  getVariantsForMyProduct,
  createVariantForMyProduct,
  updateVariantForMyProduct,
  deleteVariantForMyProduct
};

