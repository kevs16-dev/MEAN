const Banner = require('../model/banner.model');
const cloudinary = require('../config/cloudinary');

const createBanner = async ({ title, imageUrl, publicId, displayOrder, createdBy }) => {
  return Banner.create({
    title,
    imageUrl,
    publicId,
    displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    createdBy
  });
};

const getActiveBanners = async () => {
  return Banner.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
};

const getAllBanners = async () => {
  return Banner.find().sort({ displayOrder: 1, createdAt: -1 });
};

const deleteBanner = async (bannerId) => {
  const banner = await Banner.findById(bannerId);
  if (!banner) {
    throw new Error('Bannière introuvable');
  }

  await cloudinary.uploader.destroy(banner.publicId);
  await Banner.findByIdAndDelete(bannerId);
  return banner;
};

module.exports = {
  createBanner,
  getActiveBanners,
  getAllBanners,
  deleteBanner
};
