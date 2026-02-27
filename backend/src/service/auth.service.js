const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AppError = require('../utils/AppError');
const userService = require('./user.service');
const tokenConfig = require('../config/token.config');
const { logActivity } = require('./activity-log.service');

const login = async ({ email, password }, context = {}) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
        throw new AppError('INVALID_CREDENTIALS');
    }

    if (user.isActive === false) {
        throw new AppError('ACCOUNT_DISABLED', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('INVALID_PASSWORD');
    }

    const token = jwt.sign(
        { userId: user._id, role: user.role },
        tokenConfig.JWT_SECRET,
        { expiresIn: tokenConfig.JWT_EXPIRES_IN }
    );

    try {
        await logActivity({
            userId: user._id,
            actorRole: user.role,
            actionType: 'LOGIN_SUCCESS',
            entityType: 'USER',
            entityId: user._id,
            metadata: {
                ip: context.ip || null,
                userAgent: context.userAgent || null
            }
        });
    } catch (error) {
        console.error('log LOGIN_SUCCESS error:', error);
    }

    return { token, user: user };
}

const register = async ({ username, nom, prenom, email, password, captchaToken }) => {
    if (!username || !nom || !prenom || !email || !password) {
        throw new Error('Tous les champs sont requis');
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
        throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userService.createUser({
        username,
        nom,
        prenom,
        email,
        password: hashedPassword,
        role: 'CLIENT',
        isVerified: true
    });

    return { message: 'Compte créé avec succès' };
};

module.exports = {
    register,
    login
};