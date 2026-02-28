const router = require('express').Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const cartController = require('../controller/cart.controller');

router.use(authMiddleware, roleMiddleware('CLIENT'));

router.get('/', cartController.getCart);
router.get('/count', cartController.getCartCount);
router.post('/items', cartController.addItem);
router.put('/items/:variantId', cartController.updateItemQuantity);
router.delete('/items/:variantId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
