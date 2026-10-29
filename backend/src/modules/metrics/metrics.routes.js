const router = require('express').Router();
const mongoose = require('mongoose');
const asyncHandler = require('../../utils/asyncHandler');
const { auth } = require('../../middleware/auth');
const Order = require('../orders/order.model');
const Invoice = require('../invoices/invoice.model');
const { Ticket } = require('../tickets/ticket.model');
const { KbArticle } = require('../kb/kb.model');

const OPEN = ['open', 'pending'];

async function customerSummary(user) {
  const customerId = new mongoose.Types.ObjectId(user.customerId);
  const [recentOrders, unpaid, openTickets] = await Promise.all([
    Order.find({ customerId }).sort({ placedAt: -1 }).limit(5).lean(),
    Invoice.aggregate([
      { $match: { customerId, status: { $in: ['unpaid', 'overdue'] } } },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total' } } },
    ]),
    Ticket.countDocuments({ customerId, status: { $in: OPEN } }),
  ]);
  const byStatus = Object.fromEntries(unpaid.map((u) => [u._id, u]));
  return {
    recentOrders,
    openTickets,
    unpaidInvoices: byStatus.unpaid?.count || 0,
    overdueInvoices: byStatus.overdue?.count || 0,
    amountDue: (byStatus.unpaid?.amount || 0) + (byStatus.overdue?.amount || 0),
  };
}

async function staffSummary(user) {
  const userId = new mongoose.Types.ObjectId(user.id);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [byStatus, byPriority, mine, unassigned, resolution, overdueInvoices, kb, ticketsLast30] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: { status: { $in: OPEN } } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Ticket.countDocuments({ assignee: userId, status: { $in: OPEN } }),
    Ticket.countDocuments({ assignee: null, status: { $in: OPEN } }),
    Ticket.aggregate([
      { $match: { resolvedAt: { $ne: null } } },
      { $group: { _id: null, avgMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } } } },
    ]),
    Invoice.countDocuments({ status: 'overdue' }),
    KbArticle.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, views: { $sum: '$views' }, helpful: { $sum: '$helpful' }, notHelpful: { $sum: '$notHelpful' } } },
    ]),
    Ticket.countDocuments({ createdAt: { $gte: since } }),
  ]);
  const kbStats = kb[0] || { views: 0, helpful: 0, notHelpful: 0 };
  return {
    ticketsByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    openByPriority: Object.fromEntries(byPriority.map((p) => [p._id, p.count])),
    assignedToMe: mine,
    unassigned,
    avgResolutionHours: resolution[0] ? Math.round((resolution[0].avgMs / 36e5) * 10) / 10 : null,
    overdueInvoices,
    ticketsLast30Days: ticketsLast30,
    kb: {
      ...kbStats,
      // Share of "helpful" outcomes vs. tickets raised: a proxy for self-service deflection.
      deflectionRate: kbStats.helpful + ticketsLast30 ? Math.round((kbStats.helpful / (kbStats.helpful + ticketsLast30)) * 100) : 0,
    },
  };
}

router.get(
  '/summary',
  auth,
  asyncHandler(async (req, res) => {
    res.json(req.user.role === 'customer' ? await customerSummary(req.user) : await staffSummary(req.user));
  }),
);

module.exports = router;
