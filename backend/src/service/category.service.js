const Category = require('../model/categorie.model');

const createCategory = async (categoryData) => {
    return await Category.create(categoryData);
};

const getAllCategories = async () => {
    return await Category.find().populate('createdBy', 'username email');
};

module.exports = {
    createCategory,
    getAllCategories
};