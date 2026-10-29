const mongoose = require('mongoose');

const STATUSES = ['open', 'pending', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const CATEGORIES = ['billing', 'orders', 'account', 'technical', 'other'];

const ticketSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    subject: { type: String, required: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: STATUSES, default: 'open' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    resolvedAt: Date,
  },
  { timestamps: true },
);

ticketSchema.index({ status: 1, assignee: 1 });
ticketSchema.index({ customerId: 1, createdAt: -1 });

const attachmentSchema = new mongoose.Schema(
  { filename: String, originalName: String, mimeType: String, size: Number },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    internal: { type: Boolean, default: false },
    attachments: [attachmentSchema],
  },
  { timestamps: true },
);

messageSchema.index({ ticketId: 1, createdAt: 1 });

module.exports = {
  Ticket: mongoose.model('Ticket', ticketSchema),
  TicketMessage: mongoose.model('TicketMessage', messageSchema),
  STATUSES,
  PRIORITIES,
  CATEGORIES,
};
