const bcrypt = require('bcrypt');
const User = require('../model/user.model');
const AppError = require('../utils/AppError');

const updatePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('USER_NOT_FOUND', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new AppError('INVALID_CURRENT_PASSWORD', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return true;
};

const updateProfile = async (userId, updateData) => {
    const allowedFields = [
        'username',
        'nom',
        'prenom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'codePostal',
        'pays',
        'avatar'
    ];

    const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) =>
            allowedFields.includes(key)
        )
    );

    return await User.findByIdAndUpdate(
        userId,
        filteredData,
        { new: true, runValidators: true }
    );
};

const createUser = async (userData) => {
    return await User.create(userData);
};

const getUserByEmail = async (email) => {
    return await User.findOne({ email });
};

const getAllUsers = async ({ page = 1, limit = 10, role }) => {
    const query = {};
    if (role && ['ADMIN', 'BOUTIQUE', 'CLIENT'].includes(role)) {
        query.role = role;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
        User.find(query)
            .select('-password')
            .skip(skip)
            .limit(parseInt(limit)),
        User.countDocuments(query)
    ]);
    return { users, total, page: parseInt(page), limit: parseInt(limit) };
};

const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 404);
    }
    return user;
};

const updateUserByAdmin = async (userId, updateData) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 404);
    }

    // Champs autorisés pour la modification par admin
    const allowedFields = [
        'username',
        'nom',
        'prenom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'codePostal',
        'pays',
        'role',
        'isVerified',
        'password' // AJOUTER cette ligne
    ];

    const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) =>
            allowedFields.includes(key)
        )
    );

    // Si le rôle est modifié, vérifier qu'il est valide
    if (filteredData.role && !['ADMIN', 'BOUTIQUE', 'CLIENT'].includes(filteredData.role)) {
        throw new AppError('INVALID_ROLE', 400);
    }

    // Si un mot de passe est fourni, le hasher
    if (filteredData.password) {
        filteredData.password = await bcrypt.hash(filteredData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        filteredData,
        { new: true, runValidators: true }
    ).select('-password');

    return updatedUser;
};

const deleteUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 404);
    }
    
    await User.findByIdAndDelete(userId);
    return true;
};

module.exports = {
    createUser,
    getUserByEmail,
    getAllUsers,
    updateProfile,
    updatePassword,
    updateUserByAdmin,
    getUserById,
    deleteUser
};