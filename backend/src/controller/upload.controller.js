const uploadService = require('../service/upload.service');

const extractPublicId = (params) => {
  const raw = params.publicId;
  if (Array.isArray(raw)) {
    return decodeURIComponent(raw.join('/'));
  }
  return decodeURIComponent(raw || '');
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }

    const result = await uploadService.handleImageUpload(req.file);

    res.status(200).json({
      message: 'Upload réussi',
      imageUrl: result.imageUrl,
    });
  } catch (error) {
    console.error('UPLOAD CONTROLLER ERROR:', error);
    res.status(500).json({
      message: 'Erreur lors de l’upload',
      error: error.message,
    });
  }
};

exports.getImage = async (req, res) => {
  try {
    const publicId = extractPublicId(req.params);
    const image = await uploadService.getImage(publicId);

    res.status(200).json(image);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.updateImage = async (req, res) => {
  try {
    const publicId = extractPublicId(req.params);

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }

    const result = await uploadService.updateImage(publicId, req.file);

    res.status(200).json({
      message: 'Image mise à jour',
      imageUrl: result.imageUrl,
      publicId: result.publicId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const publicId = extractPublicId(req.params);
    await uploadService.deleteImage(publicId);

    res.status(200).json({ message: 'Image supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};