const Shop = require('../model/boutique.model');
const User = require('../model/user.model');

const createShop = async (shopData) => {
    return await Shop.create(shopData);
};

const getAllShops = async () => {
    return await Shop.find().populate('category', 'name').populate('createdBy', 'username');
};

const getShopById = async (id) => {
    return await Shop.findById(id).populate('category', 'name').populate('createdBy', 'username');
};

const getShopsAvailableForBoutique = async (editingUserId = null) => {
    const linked = await User.find({ role: 'BOUTIQUE', shopId: { $ne: null } })
        .select('shopId _id')
        .lean();
    const editingShopId = editingUserId
        ? (await User.findById(editingUserId).select('shopId').lean())?.shopId?.toString()
        : null;
    const linkedShopIds = linked
        .filter((u) => u.shopId && (u._id.toString() !== editingUserId))
        .map((u) => u.shopId.toString());
    return Shop.find({
        _id: { $nin: linkedShopIds },
        status: 'ACTIVE'
    })
        .select('name slug')
        .sort({ name: 1 });
};

const deleteShop = async (shopId) => {
    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw new Error('Boutique non trouvée');
    }

    await User.deleteMany({
        role: 'BOUTIQUE',
        shopId: shopId
    });

    await Shop.findByIdAndDelete(shopId);
};

module.exports = {
    createShop,
    getAllShops,
    getShopById,
    getShopsAvailableForBoutique,
    deleteShop
};