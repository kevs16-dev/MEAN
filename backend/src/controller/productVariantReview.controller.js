const productVariantReviewService = require('../service/productVariantReview.service');
const AppError = require('../utils/AppError');

const createReview = async (req, res) => {
  try {
    const { productVariantId, rating, comment } = req.body;
    const review = await productVariantReviewService.createReview(req.user.id, {
      productVariantId,
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
        message: 'Vous avez déjà un avis sur ce variant. Supprimez-le d\'abord pour en créer un nouveau.'
      });
    }
    if (error instanceof AppError) {
      const msg =
        error.code === 'ROLE_CLIENT_REQUIRED'
          ? 'Seuls les clients peuvent noter un variant'
          : error.code === 'VARIANT_NOT_FOUND'
            ? 'Variant non trouvé'
            : error.code === 'PRODUCT_VARIANT_ID_AND_RATING_REQUIRED'
              ? 'L\'identifiant du variant et la note sont requis'
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

const getReviewsByVariant = async (req, res) => {
  try {
    const { productVariantId } = req.params;
    const { page, limit } = req.query;
    const result = await productVariantReviewService.getReviewsByVariant(
      productVariantId,
      { page, limit }
    );
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      const msg =
        error.code === 'VARIANT_NOT_FOUND'
          ? 'Variant non trouvé'
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
    const { productVariantId } = req.params;
    const review = await productVariantReviewService.getMyReview(
      req.user.id,
      productVariantId
    );
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
    await productVariantReviewService.deleteMyReview(req.user.id, id);
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
  getReviewsByVariant,
  getMyReview,
  deleteMyReview
};
