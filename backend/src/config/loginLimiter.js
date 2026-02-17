const rateLimit = require('express-rate-limit');

const { login } = require('./rateLimit.config');

const loginLimiter = rateLimit({
    windowMs : login.windowMs,
    max : login.max,
    message: {
        status: 429,
        message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = loginLimiter;