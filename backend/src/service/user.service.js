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

module.exports = {
    createUser,
    getUserByEmail,
    updateProfile,
    updatePassword
};