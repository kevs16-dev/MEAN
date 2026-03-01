const shopReviewService = require('../service/shopReview.service');
const AppError = require('../utils/AppError');

const createReview = async (req, res) => {
  try {
    const { shopId, rating, comment } = req.body;
    const review = await shopReviewService.createReview(req.user.id, {
      shopId,
      rating,
      comment
    });
    res.status(201).json({
      message: 'Avis ajouté avec succès',
      review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Vous avez déjà un avis sur cette boutique. Supprimez-le d\'abord pour en créer un nouveau.'
      });
    }
    if (error instanceof AppError) {
      const msg =
        error.code === 'ROLE_CLIENT_REQUIRED'
          ? 'Seuls les clients peuvent noter une boutique'
          : error.code === 'SHOP_NOT_FOUND'
            ? 'Boutique non trouvée'
            : error.code === 'SHOP_ID_AND_RATING_REQUIRED'
              ? 'L\'identifiant de la boutique et la note sont requis'
              : error.code;
      return res.status(error.status).json({ message: msg });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message || 'Données invalides'
      });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors de l\'ajout de l\'avis'
    });
  }
};

const getReviewsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page, limit } = req.query;
    const result = await shopReviewService.getReviewsByShop(shopId, {
      page,
      limit
    });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      const msg =
        error.code === 'SHOP_NOT_FOUND'
          ? 'Boutique non trouvée'
          : error.code;
      return res.status(error.status).json({ message: msg });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors de la récupération des avis'
    });
  }
};

const getMyReview = async (req, res) => {
  try {
    const { shopId } = req.params;
    const review = await shopReviewService.getMyReview(req.user.id, shopId);
    res.status(200).json({ review });
  } catch (error) {
    if (error instanceof AppError) {
      const msg =
        error.code === 'ROLE_CLIENT_REQUIRED'
          ? 'Seuls les clients peuvent consulter leur avis'
          : error.code;
      return res.status(error.status).json({ message: msg });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors de la récupération de l\'avis'
    });
  }
};

const deleteMyReview = async (req, res) => {
  try {
    const { id } = req.params;
    await shopReviewService.deleteMyReview(req.user.id, id);
    res.status(200).json({ message: 'Avis supprimé avec succès' });
  } catch (error) {
    if (error instanceof AppError) {
      const msg =
        error.code === 'REVIEW_NOT_FOUND_OR_NOT_OWNER'
          ? 'Avis non trouvé ou vous n\'êtes pas le propriétaire'
          : error.code === 'ROLE_CLIENT_REQUIRED'
            ? 'Seuls les clients peuvent supprimer leur avis'
            : error.code;
      return res.status(error.status).json({ message: msg });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors de la suppression de l\'avis'
    });
  }
};

module.exports = {
  createReview,
  getReviewsByShop,
  getMyReview,
  deleteMyReview
};
