const router = require('express').Router();

const userController = require('../controller/user.controller');
const loginLimiter = require('../config/loginLimiter');
const authMiddleware = require('../middleware/auth.middleware');

router.put('/update-profile', authMiddleware, userController.updateProfile);
router.put('/update-password', authMiddleware, userController.updatePassword);

module.exports = router;