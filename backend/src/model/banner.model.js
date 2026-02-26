const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 255 },
    imageUrl: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
