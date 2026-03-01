const mongoose = require('mongoose');

const productVariantReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    productVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
      index: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
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

productVariantReviewSchema.index({ userId: 1, productVariantId: 1 }, { unique: true });
productVariantReviewSchema.index({ productVariantId: 1, createdAt: -1 });
// productId et shopId ont déjà index: true dans le schéma

module.exports = mongoose.model('ProductVariantReview', productVariantReviewSchema);
