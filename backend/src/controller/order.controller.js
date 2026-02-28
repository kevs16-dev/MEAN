const orderService = require('../service/order.service');
const orderReceiptPdfService = require('../service/order-receipt-pdf.service');
const User = require('../model/user.model');

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

/**
 * Télécharge un PDF récapitulatif des commandes passées (CLIENT).
 * Body: { orderIds: string[] }
 */
exports.getMyReceiptPdf = async (req, res) => {
  try {
    const { orderIds } = req.body || {};
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds].filter(Boolean);
    if (!ids.length) {
      return res.status(400).json({ message: 'orderIds requis (tableau)' });
    }

    const [orders, user] = await Promise.all([
      orderService.getMyOrdersByIdsForReceipt(req.user.id, ids),
      User.findById(req.user.id).select('nom prenom username email').lean()
    ]);

    if (!orders.length) {
      return res.status(404).json({ message: 'Aucune commande trouvée' });
    }

    const pdfBuffer = await orderReceiptPdfService.generateReceiptPdf(orders, user || {});
    const filename = `recapitulatif-commande-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    res.status(getStatusCode(error)).json({
      message: error.message || 'Erreur lors de la génération du PDF'
    });
  }
};
