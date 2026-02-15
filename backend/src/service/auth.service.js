const bcrypt = require('bcrypt');
const userService = require('./user.service');

const register = async ({ username, email, password, captchaToken }) => {
    if (!username || !email || !password) {
        throw new Error('Tous les champs sont requis');
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
        throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userService.createUser({
        username,
        email,
        password: hashedPassword,
        role: 'CLIENT',
        isVerified: true
    });

    return { message: 'Compte créé avec succès' };
};

module.exports = {
    register
};