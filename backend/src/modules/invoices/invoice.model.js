const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema(
  { description: String, qty: Number, unitPrice: Number },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    lines: [lineSchema],
    subtotal: Number,
    tax: Number,
    total: Number,
    status: { type: String, enum: ['unpaid', 'paid', 'overdue'], default: 'unpaid' },
    issuedAt: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    paidAt: Date,
  },
  { timestamps: true },
);

invoiceSchema.index({ customerId: 1, dueDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
