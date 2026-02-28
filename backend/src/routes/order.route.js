const router = require('express').Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const orderController = require('../controller/order.controller');

// Routes CLIENT (ÉTAPE 2)
router.post('/from-cart', authMiddleware, roleMiddleware('CLIENT'), orderController.createOrdersFromCart);
router.get('/my', authMiddleware, roleMiddleware('CLIENT'), orderController.getMyOrders);

// Routes BOUTIQUE (ÉTAPE 3) - /shop/* avant /:id pour éviter que "shop" soit capturé par :id
router.get('/shop/my', authMiddleware, roleMiddleware('BOUTIQUE'), orderController.getShopOrders);
router.get('/shop/:id', authMiddleware, roleMiddleware('BOUTIQUE'), orderController.getShopOrderById);
router.put('/shop/:id/confirm', authMiddleware, roleMiddleware('BOUTIQUE'), orderController.confirmOrder);
router.put('/shop/:id/reject', authMiddleware, roleMiddleware('BOUTIQUE'), orderController.rejectOrder);

router.get('/:id', authMiddleware, roleMiddleware('CLIENT'), orderController.getOrderById);

module.exports = router;
