const router = require('express').Router();

const authController = require('../controller/auth.controller');
const loginLimiter = require('../config/loginLimiter');

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

module.exports = router;