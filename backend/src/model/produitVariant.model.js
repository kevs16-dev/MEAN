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

  isActive: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);