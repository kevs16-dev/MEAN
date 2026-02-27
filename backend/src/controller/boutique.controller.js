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

exports.getProductsByShop = async (req, res) => {
    try {
        const shopId = req.params.id;
        const page = req.query.page;
        const limit = req.query.limit;
        const search = req.query.search;
        const result = await shopService.getProductsByShopId(shopId, { page, limit, search });
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Boutique non trouvée' || error.message === 'Boutique non disponible') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Erreur lors de la récupération des produits' });
    }
};

exports.getProductWithVariants = async (req, res) => {
    try {
        const shopId = req.params.id;
        const productId = req.params.productId;
        const result = await shopService.getProductWithVariantsByShop(shopId, productId);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Boutique non trouvée' || error.message === 'Boutique non disponible' || error.message === 'Produit non trouvé' || error.message === 'Produit non disponible') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Erreur lors de la récupération du produit' });
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

exports.getShopsAvailableForBoutique = async (req, res) => {
    try {
        const editingUserId = req.query.editingUserId || null;
        const shops = await shopService.getShopsAvailableForBoutique(editingUserId);
        res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Erreur lors de la récupération des boutiques disponibles' });
    }
};

exports.deleteShop = async (req, res) => {
    try {
        await shopService.deleteShop(req.params.id);
        res.status(200).json({ message: 'Boutique supprimée avec succès' });
    } catch (error) {
        if (error.message === 'Boutique non trouvée') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Erreur lors de la suppression de la boutique' });
    }
};