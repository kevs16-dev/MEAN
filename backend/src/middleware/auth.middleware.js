const jwt = require('jsonwebtoken');
const tokenConfig = require('../config/token.config');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1]; 
    try {
        const decoded = jwt.verify(token, tokenConfig.JWT_SECRET);
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};