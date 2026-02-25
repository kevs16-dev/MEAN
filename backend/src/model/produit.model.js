const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop', 
    required: true,
    index: true
  },

  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true, trim: true },

  description: { type: String },

  images: [
    {
      url: String,
      isPrimary: { type: Boolean, default: false }
    }
  ],

  status: { 
    type: String, 
    enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'],
    default: 'ACTIVE'
  }

}, { timestamps: true });

productSchema.index({ shopId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);