const router = require('express').Router();
const uploadMiddleware = require('../middleware/upload.middleware');
const uploadController = require('../controller/upload.controller');

router.post('/image', uploadMiddleware.single('image'), uploadController.uploadImage);
router.get('/image/*publicId', uploadController.getImage);
router.put('/image/*publicId', uploadMiddleware.single('image'), uploadController.updateImage);
router.delete('/image/*publicId', uploadController.deleteImage);

module.exports = router;