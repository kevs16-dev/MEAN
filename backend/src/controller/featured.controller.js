const featuredService = require('../service/featured.service');

exports.getBestSellingVariant = async (req, res) => {
  try {
    const data = await featuredService.getBestSellingVariant();
    if (!data) {
      return res.status(200).json({ featured: null });
    }
    res.status(200).json({ featured: data });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération du produit phare' });
  }
};
