const authService = require('../service/auth.service');

exports.register = async (req, res) => {
    try {
        const message = await authService.register(req.body);
        res.status(201).json({ message });
    } catch (error) {
        if (error.message === 'EMAIL_ALREADY_EXISTS') {
            return res.status(400).json({ message: 'Un compte existe déjà avec cet email' });
        }
        if (error.message === 'CAPTCHA_REQUIRED' || error.message === 'CAPTCHA_INVALID') {
            return res.status(400).json({ message: 'Veuillez valider le captcha' });
        }
        res.status(400).json({ message: error.message || 'Erreur lors de l\'inscription' });
    }
};