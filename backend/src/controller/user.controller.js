const bcrypt = require('bcrypt');
const userService = require('../service/user.service');

exports.createUserByAdmin = async (req, res) => {
    try {
        const { username, nom, prenom, email, password, telephone, adresse, ville, codePostal, pays, role } = req.body;
        if (!username || !nom || !prenom || !email || !password || !role) {
            return res.status(400).json({ message: 'Champs obligatoires manquants' });
        }
        // On force le rôle à ADMIN, CLIENT ou BOUTIQUE uniquement
        if (!['ADMIN', 'CLIENT', 'BOUTIQUE'].includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide' });
        }

        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Un utilisateur existe déjà avec cet email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userService.createUser({
            username,
            nom,
            prenom,
            email,
            password: hashedPassword,
            telephone,
            adresse,
            ville,
            codePostal,
            pays,
            role,
            isVerified: true
        });
        return res.status(201).json({ message: 'Utilisateur créé avec succès', user });
    } catch (error) {
        console.error('createUserByAdmin error:', error);
        return res.status(500).json({ message: error.message || 'Erreur lors de la création de l\'utilisateur' });
    }
};

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


exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userService.getUserById(userId);
        return res.status(200).json(user);
    } catch (error) {
        console.error('getUserById error:', error);
        return res.status(error.status || 500).json({ 
            message: error.message || "Erreur lors de la récupération de l'utilisateur" 
        });
    }
};

exports.updateUserByAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        
        // NE PAS supprimer le mot de passe - on le garde pour traitement
        // delete updateData.password;  ← SUPPRIMER cette ligne
        
        const updatedUser = await userService.updateUserByAdmin(userId, updateData);
        
        return res.status(200).json({
            message: 'Utilisateur mis à jour avec succès',
            user: updatedUser
        });
    } catch (error) {
        console.error('updateUserByAdmin error:', error);
        return res.status(error.status || 500).json({
            message: error.message || 'Erreur lors de la mise à jour de l\'utilisateur'
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const currentUserId = req.user.id;
        
        // Empecher un admin de se supprimer lui même
        if (userId === currentUserId) {
            return res.status(400).json({ 
                message: 'Vous ne pouvez pas supprimer votre propre compte' 
            });
        }
        
        await userService.deleteUser(userId);
        
        return res.status(200).json({ 
            message: 'Utilisateur supprimé avec succès' 
        });
    } catch (error) {
        console.error('deleteUser error:', error);
        return res.status(error.status || 500).json({ 
            message: error.message || 'Erreur lors de la suppression de l\'utilisateur' 
        });
    }
};