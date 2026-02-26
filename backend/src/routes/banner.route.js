const router = require('express').Router();

const bannerController = require('../controller/banner.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');

router.get('/', authMiddleware, bannerController.getBanners);
router.post('/', authMiddleware, authorize('ADMIN'), uploadMiddleware.single('image'), bannerController.createBanner);
router.delete('/:id', authMiddleware, authorize('ADMIN'), bannerController.deleteBanner);

module.exports = router;
