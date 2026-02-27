const cartService = require('../service/cart.service');

exports.getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération du panier' });
  }
};

exports.getCartCount = async (req, res) => {
  try {
    const count = await cartService.getCartCount(req.user.id);
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération du panier' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productVariantId, quantity } = req.body;
    if (!productVariantId) {
      return res.status(400).json({ message: 'productVariantId est requis' });
    }
    const cart = await cartService.addItem(req.user.id, productVariantId, quantity);
    res.status(200).json({ message: 'Article ajouté au panier', cart });
  } catch (error) {
    if (
      error.message === 'Variante non trouvée' ||
      error.message === 'Variante non disponible'
    ) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Stock')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de l\'ajout au panier' });
  }
};

exports.updateItemQuantity = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateItemQuantity(req.user.id, variantId, quantity);
    res.status(200).json({ message: 'Quantité mise à jour', cart });
  } catch (error) {
    if (error.message === 'Article non trouvé dans le panier') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Variante non disponible' || error.message.includes('Stock')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la mise à jour' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { variantId } = req.params;
    const cart = await cartService.removeItem(req.user.id, variantId);
    res.status(200).json({ message: 'Article supprimé du panier', cart });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur lors de la suppression' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    res.status(200).json({ message: 'Panier vidé', cart });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur lors du vidage du panier' });
  }
};
