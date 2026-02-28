const mongoose = require('mongoose');

const shopReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'La note doit être un entier entre 1 et 5'
      }
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null
    }
  },
  { timestamps: true }
);

shopReviewSchema.index({ userId: 1, shopId: 1 }, { unique: true });
shopReviewSchema.index({ shopId: 1, createdAt: -1 });

module.exports = mongoose.model('ShopReview', shopReviewSchema);
