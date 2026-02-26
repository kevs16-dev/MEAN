const cloudinary = require('../config/cloudinary');

const handleImageUpload = async (file) => {
  try {
    return {
      imageUrl: file.path,        
      publicId: file.filename,    
    };
  } catch (error) {
    console.error('UPLOAD SERVICE ERROR:', error);
    throw new Error('Impossible de traiter l’image');
  }
};

const getImage = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    throw new Error('Image introuvable');
  }
};

const updateImage = async (oldPublicId, newFile) => {
  try {
    await cloudinary.uploader.destroy(oldPublicId);

    return {
      imageUrl: newFile.path,
      publicId: newFile.filename,
    };
  } catch (error) {
    console.error('UPDATE IMAGE ERROR:', error);
    throw new Error('Impossible de mettre à jour l’image');
  }
};

const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('DELETE IMAGE ERROR:', error);
    throw new Error('Impossible de supprimer l’image');
  }
};

module.exports = {
    handleImageUpload,
    getImage,
    updateImage,
    deleteImage
}