const cartSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  items: [
    {
      productVariantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant'
      },
      quantity: { type: Number, required: true },
      reservedUntil: { type: Date }
    }
  ],

  expiresAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);