const shopService = require('../service/boutique.service');

exports.getShopById = async (req, res) => {
    try {
        const shop = await shopService.getShopById(req.params.id);
        if (!shop) {
            return res.status(404).json({ message: 'Boutique non trouvée' });
        }
        res.status(200).json(shop);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Erreur lors de la récupération de la boutique' });
    }
};

exports.getAllShops = async (req, res) => {
    try {
        const shops = await shopService.getAllShops();
        res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Erreur lors de la récupération des boutiques' });
    }
};

exports.createShop = async (req, res) => {
    try {
        const shopData = req.body;
        shopData.createdBy = req.user.id;
        const shop = await shopService.createShop(shopData);
        res.status(201).json({ message: 'Boutique créée avec succès', shop });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Erreur lors de la création de la boutique' });
    }
};