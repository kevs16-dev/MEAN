const userService = require('../service/user.service');

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { currentPassword, newPassword } = req.body;
        await userService.updatePassword(userId, currentPassword, newPassword);
        return res.status(200).json({
            code: 'PASSWORD_UPDATED',
            message: 'Mot de passe mis à jour avec succès'
        });
    } catch (error) {
        console.error('updatePassword error:', error);
        return res.status(error.status || 500).json({
            code: error.code || 'PASSWORD_UPDATE_ERROR',
            message: error.message || 'Erreur lors de la mise à jour du mot de passe'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; 

        const {
            username,
            nom,
            prenom,
            telephone,
            adresse,
            ville,
            codePostal,
            pays,
            bio,
            avatar
        } = req.body;

        const updatedUser = await userService.updateProfile(userId, {
            username,
            nom,
            prenom,
            telephone,
            adresse,
            ville,
            codePostal,
            pays,
            bio,
            avatar
        });

        return res.status(200).json({
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message || 'Erreur lors de la mise à jour du profil'
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role } = req.query;
        const result = await userService.getAllUsers({ page, limit, role });
        return res.status(200).json(result);
    } catch (error) {
        console.error('getAllUsers error:', error);
        return res.status(error.status || 500).json({
            message: error.message || 'Erreur lors de la récupération des utilisateurs'
        });
    }
};