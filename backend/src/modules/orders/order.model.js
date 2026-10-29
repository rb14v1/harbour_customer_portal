const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  { sku: String, name: String, qty: Number, unitPrice: Number },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [itemSchema],
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    subtotal: Number,
    tax: Number,
    total: Number,
    placedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

orderSchema.index({ customerId: 1, placedAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
