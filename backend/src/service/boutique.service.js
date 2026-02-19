const Shop = require('../model/boutique.model');

const createShop = async (shopData) => {
    return await Shop.create(shopData);
};

const getAllShops = async () => {
    return await Shop.find().populate('category', 'name').populate('createdBy', 'username');
}

const getShopById = async (id) => {
    return await Shop.findById(id).populate('category', 'name').populate('createdBy', 'username');
}

module.exports = {
    createShop,
    getAllShops,
    getShopById
};