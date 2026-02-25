const router = require('express').Router();

router.use('/test', require('./test.route'));
router.use('/auth', require('./auth.route'));
router.use('/users', require('./user.route'));
router.use('/categories', require('./category.route'));
router.use('/shops', require('./shop.route'));
router.use('/notifications', require('./notification.route'));
router.use('/products', require('./product.route'));

module.exports = router;
