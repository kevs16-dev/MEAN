const productService = require('../service/product.service');
const AppError = require('../utils/AppError');

exports.getMyProducts = async (req, res) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const search = req.query.search;
    const result = await productService.getMyProducts(req.user.id, { page, limit, search });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.code });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération des produits' });
  }
};

exports.createProductForMyShop = async (req, res) => {
  try {
    const product = await productService.createProductForMyShop(req.user.id, req.body);
    res.status(201).json({
      message: 'Produit créé avec succès',
      product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un produit avec ce slug existe déjà pour cette boutique' });
    }
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.code });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la création du produit' });
  }
};

exports.getMyProductById = async (req, res) => {
  try {
    const product = await productService.getMyProductById(req.user.id, req.params.id);
    res.status(200).json(product);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.code });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération du produit' });
  }
};

exports.getMyProductWithVariants = async (req, res) => {
  try {
    const result = await productService.getMyProductWithVariants(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.code });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération du produit' });
  }
};

exports.updateMyProduct = async (req, res) => {
  try {
    const product = await productService.updateMyProduct(req.user.id, req.params.id, req.body);
    res.status(200).json({
      message: 'Produit mis à jour avec succès',
      product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un produit avec ce slug existe déjà pour cette boutique' });
    }
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.code });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la mise à jour du produit' });
  }
};

exports.deleteMyProduct = async (req, res) => {
  try {
    await productService.deleteMyProduct(req.user.id, req.params.id);
    res.status(200).json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.code });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la suppression du produit' });
  }
};

exports.getVariantsForMyProduct = async (req, res) => {
  try {
    const variants = await productService.getVariantsForMyProduct(req.user.id, req.params.productId);
    res.status(200).json(variants);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.code });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération des variantes' });
  }
};

exports.createVariantForMyProduct = async (req, res) => {
  try {
    const variant = await productService.createVariantForMyProduct(req.user.id, req.params.productId, req.body);
    res.status(201).json({
      message: 'Variante créée avec succès',
      variant
    });
  } catch (error) {
    if (error instanceof AppError) {
      const msg = error.code === 'VARIANT_ATTRIBUTES_REQUIRED'
        ? 'Chaque variante doit avoir au moins un attribut (nom et valeur).'
        : error.code;
      return res.status(error.status).json({ message: msg });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la création de la variante' });
  }
};

exports.updateVariantForMyProduct = async (req, res) => {
  try {
    const variant = await productService.updateVariantForMyProduct(
      req.user.id,
      req.params.productId,
      req.params.variantId,
      req.body
    );
    res.status(200).json({
      message: 'Variante mise à jour avec succès',
      variant
    });
  } catch (error) {
    if (error instanceof AppError) {
      const msg = error.code === 'VARIANT_ATTRIBUTES_REQUIRED'
        ? 'Chaque variante doit avoir au moins un attribut (nom et valeur).'
        : error.code;
      return res.status(error.status).json({ message: msg });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la mise à jour de la variante' });
  }
};

exports.deleteVariantForMyProduct = async (req, res) => {
  try {
    await productService.deleteVariantForMyProduct(
      req.user.id,
      req.params.productId,
      req.params.variantId
    );
    res.status(200).json({ message: 'Variante supprimée avec succès' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.code });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la suppression de la variante' });
  }
};

