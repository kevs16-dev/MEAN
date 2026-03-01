const ProductVariantReview = require('../model/productVariantReview.model');
const ProductVariant = require('../model/produitVariant.model');
const Product = require('../model/produit.model');
const User = require('../model/user.model');
const AppError = require('../utils/AppError');

/**
 * Vérifie que l'utilisateur est CLIENT.
 */
const ensureClient = async (userId) => {
  const user = await User.findById(userId).select('role');
  if (!user || user.role !== 'CLIENT') {
    throw new AppError('ROLE_CLIENT_REQUIRED', 403);
  }
};

/**
 * Récupère le variant et ses infos produit/shop pour construire l'avis.
 */
const getVariantWithContext = async (productVariantId) => {
  const variant = await ProductVariant.findById(productVariantId)
    .populate('productId', 'shopId name');
  if (!variant) {
    throw new AppError('VARIANT_NOT_FOUND', 404);
  }
  if (!variant.productId) {
    throw new AppError('PRODUCT_NOT_FOUND', 404);
  }
  return variant;
};

/**
 * Créer un avis sur un variant (CLIENT uniquement).
 * Si l'utilisateur a déjà un avis, on le supprime puis on en crée un nouveau.
 */
const createReview = async (userId, { productVariantId, rating, comment }) => {
  await ensureClient(userId);

  if (!productVariantId || rating == null) {
    throw new AppError('PRODUCT_VARIANT_ID_AND_RATING_REQUIRED', 400);
  }

  const variant = await getVariantWithContext(productVariantId);
  const productId = variant.productId._id;
  const shopId = variant.productId.shopId;

  await ProductVariantReview.deleteOne({ userId, productVariantId });

  const review = await ProductVariantReview.create({
    userId,
    productVariantId,
    productId,
    shopId,
    rating: parseInt(rating, 10),
    comment: comment && String(comment).trim() ? String(comment).trim() : null
  });

  return review.populate('userId', 'nom prenom username');
};

/**
 * Liste des avis d'un variant avec note moyenne (CLIENT ou BOUTIQUE).
 */
const getReviewsByVariant = async (productVariantId, options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const variant = await ProductVariant.findById(productVariantId);
  if (!variant) {
    throw new AppError('VARIANT_NOT_FOUND', 404);
  }

  const [reviews, total, stats] = await Promise.all([
    ProductVariantReview.find({ productVariantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'nom prenom username')
      .lean(),
    ProductVariantReview.countDocuments({ productVariantId }),
    ProductVariantReview.aggregate([
      { $match: { productVariantId: variant._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const averageRating = stats[0]
    ? Math.round(stats[0].averageRating * 10) / 10
    : null;
  const totalCount = stats[0] ? stats[0].count : 0;

  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    averageRating,
    totalCount
  };
};

/**
 * Avis de l'utilisateur courant sur un variant (CLIENT uniquement).
 */
const getMyReview = async (userId, productVariantId) => {
  await ensureClient(userId);

  const review = await ProductVariantReview.findOne({
    userId,
    productVariantId
  })
    .populate('userId', 'nom prenom username')
    .lean();

  return review;
};

/**
 * Supprimer mon avis (CLIENT uniquement, propriétaire uniquement).
 */
const deleteMyReview = async (userId, reviewId) => {
  await ensureClient(userId);

  const review = await ProductVariantReview.findOne({
    _id: reviewId,
    userId
  });

  if (!review) {
    throw new AppError('REVIEW_NOT_FOUND_OR_NOT_OWNER', 404);
  }

  await ProductVariantReview.deleteOne({ _id: reviewId });
  return review;
};

module.exports = {
  createReview,
  getReviewsByVariant,
  getMyReview,
  deleteMyReview
};
