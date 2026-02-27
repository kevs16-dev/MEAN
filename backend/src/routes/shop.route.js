const router = require('express').Router();
const authorize = require('../middleware/authorize.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const shopController = require('../controller/boutique.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/', authMiddleware, authorize('ADMIN'), shopController.createShop);
router.get('/', shopController.getAllShops);
router.get('/available-for-boutique', authMiddleware, roleMiddleware('ADMIN'), shopController.getShopsAvailableForBoutique);
router.delete('/:id', authMiddleware, authorize('ADMIN'), shopController.deleteShop);
router.get('/:id/products', shopController.getProductsByShop);
router.get('/:id', shopController.getShopById);

module.exports = router;