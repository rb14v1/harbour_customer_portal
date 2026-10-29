const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['customer', 'agent', 'admin'], required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    isActive: { type: Boolean, default: true },
    resetTokenHash: { type: String, select: false },
    resetTokenExp: { type: Date, select: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
