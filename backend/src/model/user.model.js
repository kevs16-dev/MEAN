const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    telephone: { type: String, required: false },
    adresse: { type: String, required: false },
    ville: { type: String, required: false },
    codePostal: { type: String, required: false },
    pays: { type: String, required: false},
    role: { type: String, enum: ['CLIENT', 'ADMIN', 'BOUTIQUE'], default: 'CLIENT' },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);