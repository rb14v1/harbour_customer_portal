const fs = require('fs/promises');
const path = require('path');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const { paginate } = require('../../utils/pagination');
const { scopeFilter } = require('../../utils/scope');
const { sendMail } = require('../../utils/mailer');
const { UPLOAD_DIR } = require('../../middleware/upload');
const { nextSeq } = require('../counters/counter.model');
const { audit } = require('../audit/audit.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const { Ticket, TicketMessage } = require('./ticket.model');

const isStaff = (user) => user.role === 'agent' || user.role === 'admin';
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findScoped(user, id) {
  const ticket = await Ticket.findOne(scopeFilter(user, { _id: id }));
  if (!ticket) throw new AppError(404, 'Ticket not found');
  return ticket;
}

async function list(user, { page, limit, status, priority, assignee, q }) {
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (isStaff(user) && assignee) filter.assignee = assignee === 'me' ? user.id : assignee === 'none' ? null : assignee;
  if (q) filter.subject = new RegExp(escapeRegex(q), 'i');
  return paginate(Ticket, scopeFilter(user, filter), {
    page,
    limit,
    sort: { updatedAt: -1 },
    populate: [
      { path: 'customerId', select: 'name' },
      { path: 'assignee', select: 'name' },
    ],
  });
}

async function get(user, id) {
  const ticket = await findScoped(user, id);
  await ticket.populate([
    { path: 'customerId', select: 'name' },
    { path: 'createdBy', select: 'name email' },
    { path: 'assignee', select: 'name email' },
    { path: 'orderId', select: 'number' },
  ]);
  const messageFilter = { ticketId: ticket._id };
  if (!isStaff(user)) messageFilter.internal = false;
  const messages = await TicketMessage.find(messageFilter).sort({ createdAt: 1 }).populate('authorId', 'name role').lean();
  return { ...ticket.toObject(), messages };
}

async function notifyStaff(ticket, text) {
  const recipients = ticket.assignee
    ? await User.find({ _id: ticket.assignee }).lean()
    : await User.find({ role: 'agent', isActive: true }).lean();
  await Promise.all(
    recipients.map((r) => sendMail({ to: r.email, subject: `[Ticket #${ticket.number}] ${ticket.subject}`, text })),
  );
}

async function notifyCustomer(ticket, text) {
  const creator = await User.findById(ticket.createdBy).lean();
  if (creator) await sendMail({ to: creator.email, subject: `[Ticket #${ticket.number}] ${ticket.subject}`, text });
}

async function create(user, { subject, body, priority, category, orderId }) {
  if (!user.customerId) throw new AppError(403, 'Only customer accounts can open tickets');
  if (orderId && !(await Order.exists({ _id: orderId, customerId: user.customerId }))) {
    throw new AppError(400, 'Order not found');
  }
  const ticket = await Ticket.create({
    number: await nextSeq('ticketNumber'),
    subject,
    priority,
    category,
    orderId,
    customerId: user.customerId,
    createdBy: user.id,
  });
  await TicketMessage.create({ ticketId: ticket._id, authorId: user.id, body });
  await notifyStaff(ticket, `New ticket from ${user.name}:\n\n${body}\n\n${env.CLIENT_ORIGIN}/tickets/${ticket._id}`);
  return ticket.toObject();
}

async function update(user, id, changes) {
  const ticket = await findScoped(user, id);

  if (!isStaff(user)) {
    const allowed = Object.keys(changes).every((k) => k === 'status') && ['closed', 'open'].includes(changes.status);
    if (!allowed) throw new AppError(403, 'Customers can only close or reopen their tickets');
  }
  if (changes.assignee) {
    const assignee = await User.exists({ _id: changes.assignee, role: { $in: ['agent', 'admin'] }, isActive: true });
    if (!assignee) throw new AppError(400, 'Assignee must be an active agent or admin');
  }

  const previousStatus = ticket.status;
  Object.assign(ticket, changes);
  if (changes.assignee === null) ticket.assignee = undefined;
  if (changes.status && ['resolved', 'closed'].includes(changes.status) && !ticket.resolvedAt) ticket.resolvedAt = new Date();
  if (changes.status && ['open', 'pending'].includes(changes.status)) ticket.resolvedAt = undefined;
  await ticket.save();

  await audit(user.id, 'ticket.update', 'ticket', ticket._id, changes);
  if (changes.status && changes.status !== previousStatus && isStaff(user)) {
    await notifyCustomer(ticket, `Your ticket status changed to "${changes.status}".\n\n${env.CLIENT_ORIGIN}/tickets/${ticket._id}`);
  }
  return ticket.toObject();
}

async function addMessage(user, id, { body, internal }, files = []) {
  const ticket = await findScoped(user, id).catch(async (err) => {
    await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
    throw err;
  });
  const isInternal = isStaff(user) && internal;

  const message = await TicketMessage.create({
    ticketId: ticket._id,
    authorId: user.id,
    body,
    internal: isInternal,
    attachments: files.map((f) => ({ filename: f.filename, originalName: f.originalname, mimeType: f.mimetype, size: f.size })),
  });

  if (!isInternal) {
    if (isStaff(user)) {
      if (ticket.status === 'open') ticket.status = 'pending';
      if (!ticket.assignee) ticket.assignee = user.id;
      await notifyCustomer(ticket, `${user.name} replied:\n\n${body}\n\n${env.CLIENT_ORIGIN}/tickets/${ticket._id}`);
    } else {
      if (['pending', 'resolved'].includes(ticket.status)) ticket.status = 'open';
      await notifyStaff(ticket, `${user.name} replied:\n\n${body}`);
    }
  }
  ticket.updatedAt = new Date();
  await ticket.save();

  return message.toObject();
}

async function attachmentPath(user, id, filename) {
  const ticket = await findScoped(user, id);
  const messageFilter = { ticketId: ticket._id, 'attachments.filename': filename };
  if (!isStaff(user)) messageFilter.internal = false;
  const message = await TicketMessage.findOne(messageFilter).lean();
  if (!message) throw new AppError(404, 'Attachment not found');
  const attachment = message.attachments.find((a) => a.filename === filename);
  return { path: path.join(UPLOAD_DIR, filename), originalName: attachment.originalName, mimeType: attachment.mimeType };
}

module.exports = { list, get, create, update, addMessage, attachmentPath, isStaff };
