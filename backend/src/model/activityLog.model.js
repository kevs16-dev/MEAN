const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    actorRole: {
      type: String,
      enum: ['ADMIN', 'BOUTIQUE', 'CLIENT'],
      required: true
    },
    actionType: {
      type: String,
      enum: ['PRODUCT_CREATED', 'PRODUCT_UPDATED', 'EVENT_CREATED', 'LOGIN_SUCCESS'],
      required: true,
      index: true
    },
    entityType: {
      type: String,
      enum: ['PRODUCT', 'EVENT', 'USER'],
      required: true,
      index: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, actionType: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
