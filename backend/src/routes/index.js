const router = require('express').Router();

router.use('/test', require('./test.route'));
router.use('/auth', require('./auth.route'));
router.use('/users', require('./user.route'));
router.use('/categories', require('./category.route'));
router.use('/shops', require('./shop.route'));
router.use('/notifications', require('./notification.route'));
router.use('/products', require('./product.route'));
router.use('/events', require('./event.route'));
router.use('/cart', require('./cart.route'));
router.use('/orders', require('./order.route'));
router.use('/admin', require('./admin.route'));
router.use('/upload', require('./upload.route'));
router.use('/banners', require('./banner.route'));
router.use('/reviews', require('./review.route'));
router.use('/featured', require('./featured.route'));

module.exports = router;
