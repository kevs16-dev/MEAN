const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 100 },
    maxPlaces: { type: Number, required: true, min: 1 },
    paf: { type: Number, required: true, min: 0 }
}, { _id: false });

const registrationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketTypeName: { type: String, required: true, maxlength: 100 },
    registeredAt: { type: Date, default: Date.now }
}, { _id: false });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String },
    isPrivate: { type: Boolean, default: false },
    ticketTypes: { type: [ticketTypeSchema], default: [] },
    registrations: { type: [registrationSchema], default: [] },
    reminderDaysBefore: { type: Number, min: 0, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetRoles: { type: [String], enum: ['ADMIN', 'BOUTIQUE', 'CLIENT', 'ALL'], default: ['ALL'] },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'], default: 'DRAFT' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);