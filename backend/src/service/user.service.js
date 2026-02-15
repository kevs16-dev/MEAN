const User = require('../model/user.model');

const createUser = async (userData) => {
    return await User.create(userData);
};

const getUserByEmail = async (email) => {
    return await User.findOne({ email });
};

module.exports = {
    createUser,
    getUserByEmail
};