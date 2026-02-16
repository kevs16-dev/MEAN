const router = require('express').Router();

const authController = require('../controller/auth.controller');
const loginLimiter = require('../middleware/loginLimiter');

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);

module.exports = router;