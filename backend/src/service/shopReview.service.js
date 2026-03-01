const ShopReview = require('../model/shopReview.model');
const Shop = require('../model/boutique.model');
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
 * Vérifie que la boutique existe.
 */
const ensureShopExists = async (shopId) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError('SHOP_NOT_FOUND', 404);
  }
  return shop;
};

/**
 * Créer un avis sur une boutique (CLIENT uniquement).
 * Si l'utilisateur a déjà un avis, on le supprime puis on en crée un nouveau.
 */
const createReview = async (userId, { shopId, rating, comment }) => {
  await ensureClient(userId);

  if (!shopId || rating == null) {
    throw new AppError('SHOP_ID_AND_RATING_REQUIRED', 400);
  }

  await ensureShopExists(shopId);

  await ShopReview.deleteOne({ userId, shopId });

  const review = await ShopReview.create({
    userId,
    shopId,
    rating: parseInt(rating, 10),
    comment: comment && String(comment).trim() ? String(comment).trim() : null
  });

  return review.populate('userId', 'nom prenom username');
};

/**
 * Liste des avis d'une boutique avec note moyenne (CLIENT ou BOUTIQUE).
 */
const getReviewsByShop = async (shopId, options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError('SHOP_NOT_FOUND', 404);
  }

  const [reviews, total, stats] = await Promise.all([
    ShopReview.find({ shopId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'nom prenom username')
      .lean(),
    ShopReview.countDocuments({ shopId }),
    ShopReview.aggregate([
      { $match: { shopId: shop._id } },
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
 * Avis de l'utilisateur courant sur une boutique (CLIENT uniquement).
 */
const getMyReview = async (userId, shopId) => {
  await ensureClient(userId);

  const review = await ShopReview.findOne({
    userId,
    shopId
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

  const review = await ShopReview.findOne({
    _id: reviewId,
    userId
  });

  if (!review) {
    throw new AppError('REVIEW_NOT_FOUND_OR_NOT_OWNER', 404);
  }

  await ShopReview.deleteOne({ _id: reviewId });
  return review;
};

module.exports = {
  createReview,
  getReviewsByShop,
  getMyReview,
  deleteMyReview
};
