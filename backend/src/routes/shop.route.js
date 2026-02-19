const router = require('express').Router();
const authorize = require('../middleware/authorize.middleware');

const shopController = require('../controller/boutique.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/', authMiddleware, authorize('ADMIN'), shopController.createShop);
router.get('/', shopController.getAllShops);
router.get('/:id', shopController.getShopById);

module.exports = router;