const orderService = require('../service/order.service');

exports.createOrdersFromCart = async (req, res) => {
  try {
    const result = await orderService.createOrdersFromCart(req.user.id);
    res.status(201).json({
      message: 'Commande(s) passée(s) avec succès',
      orders: result.orders
    });
  } catch (error) {
    if (error.message === 'Panier vide' || error.message === 'Aucun article valide dans le panier') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Stock insuffisant') || error.message.includes('Stock')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors du passage de commande'
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const result = await orderService.getMyOrders(req.user.id, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Erreur lors de la récupération des commandes'
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(req.user.id, id);
    res.status(200).json(order);
  } catch (error) {
    if (error.message === 'Commande non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors de la récupération de la commande'
    });
  }
};

// Routes BOUTIQUE (ÉTAPE 3)
exports.getShopOrders = async (req, res) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const status = req.query.status;
    const result = await orderService.getShopOrders(req.user.id, { page, limit, status });
    res.status(200).json(result);
  } catch (error) {
    if (
      error.message === 'Utilisateur BOUTIQUE non trouvé' ||
      error.message === 'Aucune boutique associée' ||
      error.message === 'Boutique non disponible'
    ) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors de la récupération des commandes'
    });
  }
};

exports.getShopOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getShopOrderById(req.user.id, id);
    res.status(200).json(order);
  } catch (error) {
    if (error.message === 'Commande non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message === 'Utilisateur BOUTIQUE non trouvé' ||
      error.message === 'Aucune boutique associée' ||
      error.message === 'Boutique non disponible'
    ) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors de la récupération de la commande'
    });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.confirmOrder(req.user.id, id);
    res.status(200).json({ message: 'Commande confirmée', order });
  } catch (error) {
    if (error.message === 'Commande non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message === 'Cette commande ne peut plus être confirmée' ||
      error.message.includes('Stock') ||
      error.message.includes('Stock réservé')
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (
      error.message === 'Utilisateur BOUTIQUE non trouvé' ||
      error.message === 'Aucune boutique associée' ||
      error.message === 'Boutique non disponible'
    ) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors de la confirmation'
    });
  }
};

exports.rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.rejectOrder(req.user.id, id);
    res.status(200).json({ message: 'Commande rejetée', order });
  } catch (error) {
    if (error.message === 'Commande non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Cette commande ne peut plus être rejetée') {
      return res.status(400).json({ message: error.message });
    }
    if (
      error.message === 'Utilisateur BOUTIQUE non trouvé' ||
      error.message === 'Aucune boutique associée' ||
      error.message === 'Boutique non disponible'
    ) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({
      message: error.message || 'Erreur lors du rejet'
    });
  }
};
