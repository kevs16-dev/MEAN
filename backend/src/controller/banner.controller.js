const bannerService = require('../service/banner.service');

exports.createBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image obligatoire' });
    }

    const banner = await bannerService.createBanner({
      title: req.body.title,
      imageUrl: req.file.path,
      publicId: req.file.filename,
      displayOrder: req.body.displayOrder,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Bannière créée avec succès',
      banner
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur lors de la création de la bannière' });
  }
};

exports.getBanners = async (req, res) => {
  try {
    const includeAll = req.query.all === '1' || req.query.all === 'true';
    const banners = includeAll ? await bannerService.getAllBanners() : await bannerService.getActiveBanners();
    res.status(200).json({ banners });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération des bannières' });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await bannerService.deleteBanner(req.params.id);
    res.status(200).json({ message: 'Bannière supprimée avec succès' });
  } catch (error) {
    if (error.message === 'Bannière introuvable') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Erreur lors de la suppression de la bannière' });
  }
};
