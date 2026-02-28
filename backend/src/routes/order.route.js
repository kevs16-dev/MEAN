const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const orderController = require('../controller/order.controller');

router.post('/from-cart', authMiddleware, roleMiddleware('CLIENT'), orderController.createOrdersFromCart);
router.post('/my/receipt-pdf', authMiddleware, roleMiddleware('CLIENT'), orderController.getMyReceiptPdf);
router.get('/my', authMiddleware, roleMiddleware('CLIENT'), orderController.getMyOrders);

router.get('/shop/my', authMiddleware, roleMiddleware('BOUTIQUE'), orderController.getShopOrders);
router.get('/shop/:id', authMiddleware, roleMiddleware('BOUTIQUE'), orderController.getShopOrderById);
router.put('/shop/:id/confirm', authMiddleware, roleMiddleware('BOUTIQUE'), orderController.confirmOrder);
router.put('/shop/:id/reject', authMiddleware, roleMiddleware('BOUTIQUE'), orderController.rejectOrder);
router.get('/:id', authMiddleware, roleMiddleware('CLIENT'), orderController.getMyOrderById);

module.exports = router;
