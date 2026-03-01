const ProductVariant = require('../model/produitVariant.model');

/**
 * Récupère la variante de produit la plus vendue (toutes boutiques confondues).
 * @returns {Promise<Object|null>} Variante avec product et shop populés, ou null si aucune.
 */
const getBestSellingVariant = async () => {
  const variant = await ProductVariant.findOne({ isActive: true })
    .sort({ soldCount: -1 })
    .limit(1)
    .populate({
      path: 'productId',
      populate: { path: 'shopId' }
    })
    .lean();

  if (!variant || !variant.productId || !variant.productId.shopId) {
    return null;
  }

  if (variant.productId.status !== 'ACTIVE' || variant.productId.shopId.status !== 'ACTIVE') {
    return null;
  }

  const product = variant.productId;
  const shop = product.shopId;

  return {
    variant: {
      _id: variant._id,
      sku: variant.sku,
      attributes: variant.attributes || [],
      currentPrice: variant.currentPrice,
      soldCount: variant.soldCount,
      imageUrl: variant.imageUrl
    },
    product: {
      _id: product._id,
      name: product.name,
      description: product.description,
      images: product.images || []
    },
    shop: {
      _id: shop._id,
      name: shop.name,
      slug: shop.slug
    }
  };
};

module.exports = { getBestSellingVariant };
