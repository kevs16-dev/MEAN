const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const productVariantReviewController = require('../controller/productVariantReview.controller');
const shopReviewController = require('../controller/shopReview.controller');

const clientOnly = [authMiddleware, roleMiddleware('CLIENT')];
const clientOrBoutique = [authMiddleware, roleMiddleware('CLIENT', 'BOUTIQUE')];

// ========== Avis sur les variants de produits ==========
router.post('/variants', clientOnly, productVariantReviewController.createReview);
router.get('/variants/:productVariantId/me', clientOnly, productVariantReviewController.getMyReview);
router.get('/variants/:productVariantId', clientOrBoutique, productVariantReviewController.getReviewsByVariant);
router.delete('/variants/:id', clientOnly, productVariantReviewController.deleteMyReview);

// ========== Avis sur les boutiques ==========
router.post('/shops', clientOnly, shopReviewController.createReview);
router.get('/shops/:shopId/me', clientOnly, shopReviewController.getMyReview);
router.get('/shops/:shopId', clientOrBoutique, shopReviewController.getReviewsByShop);
router.delete('/shops/:id', clientOnly, shopReviewController.deleteMyReview);

module.exports = router;
