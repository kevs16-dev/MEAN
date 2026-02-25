const orderSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },

  items: [
    {
      productVariantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant'
      },
      nameSnapshot: String,
      priceSnapshot: Number,
      quantity: Number
    }
  ],

  totalAmount: Number,

  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },

  paymentMethod: {
    type: String,
    enum: ['MOBILE_MONEY', 'CARD', 'CASH_PICKUP']
  },

  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);