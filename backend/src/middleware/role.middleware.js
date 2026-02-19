module.exports = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Non authentifié' });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'Accès interdit' });
        }

        next();
    };
};
