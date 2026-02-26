const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  price: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  reason: { 
    type: String, 
    enum: ['NORMAL', 'PROMOTION', 'EVENT'],
    default: 'NORMAL'
  }
}, { _id: false });

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true }
}, { _id: false });

const productVariantSchema = new mongoose.Schema({

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },

  attributes: [attributeSchema],

  sku: { type: String },

  stock: { type: Number, default: 0, min: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
  soldCount: { type: Number, default: 0, min: 0 },

  currentPrice: { type: Number, required: true, min: 0 },

  priceHistory: [priceHistorySchema],

  lowStockAlertThreshold: { type: Number, default: 5 },

  isActive: { type: Boolean, default: true },

  /** Image facultative : simple URL (Google Drive, Imgur, ou tout lien direct vers l'image) */
  imageUrl: { type: String }

}, { timestamps: true });

/** SKU généré automatiquement à la création (unique par variante) */
productVariantSchema.pre('save', async function () {
  if (this.isNew && (!this.sku || !String(this.sku).trim())) {
    const idStr = this._id.toString();
    this.sku = 'SKU-' + idStr.slice(-12);
  }
});

module.exports = mongoose.model('ProductVariant', productVariantSchema);