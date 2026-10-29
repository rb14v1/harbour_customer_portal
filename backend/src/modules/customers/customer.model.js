const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    externalId: { type: String, required: true, unique: true },
    email: String,
    phone: String,
    address: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Customer', customerSchema);
