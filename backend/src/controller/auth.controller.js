const authService = require('../service/auth.service');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe sont requis' });
        }

        const result = await authService.login({ email, password });
        res.status(200).json({ message: 'Connexion réussie', token: result.token, user: result.user });
    } catch (error) {
        if (error.code === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ message: 'Email incorrect ou compte inexistant' });
        }

        if (error.code === 'INVALID_PASSWORD') {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        res.status(500).json({ message: error.message || 'Erreur lors de la connexion' });
    }
};

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