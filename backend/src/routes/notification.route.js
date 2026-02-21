const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const notificationController = require('../controller/notification.controller');

router.post('/', authMiddleware, notificationController.create);
router.get('/user', authMiddleware, notificationController.getByUser);
router.patch('/:id/read', authMiddleware, notificationController.patch);

module.exports = router;