const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String },
    reminderDaysBefore: { type: Number, min: 0, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetRoles: { type: [String], enum: ['ADMIN', 'BOUTIQUE', 'CLIENT', 'ALL'], default: ['ALL'] },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'], default: 'DRAFT' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);