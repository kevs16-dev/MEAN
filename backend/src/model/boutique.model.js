const mongoose = require('mongoose');

const boutiqueSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true, trim: true },
    description: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    logo: { type: String},
    coverImage: { type: String },
    contact: { 
        phone: { type: String },
        email: { type: String, lowercase: true }
    },
    location: {
      floor: { type: String },
      block: { type: String }
    },
    openingHours: {
        monday: { type: String },
        tuesday: { type: String },
        wednesday: { type: String },
        thursday: { type: String },
        friday: { type: String },
        saturday: { type: String },
        sunday: { type: String }
    },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'CLOSED'], default: 'ACTIVE'},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
  }, { timestamps: true }
);

module.exports = mongoose.model('Shop', boutiqueSchema);