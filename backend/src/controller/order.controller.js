const orderService = require('../service/order.service');

const getStatusCode = (error) => error?.status || 500;

exports.createOrdersFromCart = async (req, res) => {
  try {
    const orders = await orderService.createOrdersFromCart(req.user.id);
    res.status(201).json({
      message: 'Commandes créées avec succès',
      orders
    });
  } catch (error) {
    res.status(getStatusCode(error)).json({
      message: error.message || 'Erreur lors de la création des commandes'
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await orderService.getMyOrders(req.user.id, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({
      message: error.message || 'Erreur lors de la récupération des commandes'
    });
  }
};

exports.getMyOrderById = async (req, res) => {
  try {
    const order = await orderService.getMyOrderById(req.user.id, req.params.id);
    res.status(200).json(order);
  } catch (error) {
    res.status(getStatusCode(error)).json({
      message: error.message || 'Erreur lors de la récupération de la commande'
    });
  }
};

exports.getShopOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await orderService.getShopOrders(req.user.id, { page, limit, status });
    res.status(200).json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({
      message: error.message || 'Erreur lors de la récupération des commandes boutique'
    });
  }
};

exports.getShopOrderById = async (req, res) => {
  try {
    const order = await orderService.getShopOrderById(req.user.id, req.params.id);
    res.status(200).json(order);
  } catch (error) {
    res.status(getStatusCode(error)).json({
      message: error.message || 'Erreur lors de la récupération de la commande boutique'
    });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const order = await orderService.confirmOrder(req.user.id, req.params.id);
    res.status(200).json({
      message: 'Commande confirmée',
      order
    });
  } catch (error) {
    res.status(getStatusCode(error)).json({
      message: error.message || 'Erreur lors de la confirmation de la commande'
    });
  }
};

exports.rejectOrder = async (req, res) => {
  try {
    const order = await orderService.rejectOrder(req.user.id, req.params.id);
    res.status(200).json({
      message: 'Commande rejetée',
      order
    });
  } catch (error) {
    res.status(getStatusCode(error)).json({
      message: error.message || 'Erreur lors du rejet de la commande'
    });
  }
};
