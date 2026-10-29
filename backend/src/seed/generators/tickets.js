const { Types } = require('mongoose');
const { ticketTopics } = require('../data/catalog');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const agentReplies = [
  'Thanks for reaching out. I am looking into this now and will update you shortly.',
  'Could you share a photo or screenshot so we can investigate further?',
  'I have checked with our warehouse team and will follow up with tracking details.',
  'We have issued a correction. Please let us know if anything still looks off.',
  'Please try the steps in our knowledge base article and let me know the result.',
  'This has been escalated to our specialist team.',
];
const customerReplies = [
  'Thanks, here are the details you asked for.',
  'That worked, thank you!',
  'Still seeing the same problem unfortunately.',
  'Any update on this?',
  'Attached the requested information.',
];
const internalNotes = [
  'Checked ERP — shipment left warehouse on time, carrier delay.',
  'Customer is a priority account, handle quickly.',
  'Possible duplicate of an earlier ticket.',
  'Waiting on vendor RMA number.',
];

function generateTickets(faker, { customers, users, orders, count }) {
  const now = Date.now();
  const agents = users.filter((u) => u.role === 'agent');
  const tickets = [];
  const messages = [];

  for (let i = 0; i < count; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const author = faker.helpers.arrayElement(users.filter((u) => String(u.customerId) === String(customer._id)));
    const category = faker.helpers.arrayElement(Object.keys(ticketTopics));
    const createdAt = new Date(now - faker.number.int({ min: 1, max: 60 * 24 }) * HOUR);
    const status = faker.helpers.weightedArrayElement([
      { weight: 3, value: 'open' },
      { weight: 3, value: 'pending' },
      { weight: 3, value: 'resolved' },
      { weight: 2, value: 'closed' },
    ]);
    const assignee = status === 'open' && faker.datatype.boolean() ? undefined : faker.helpers.arrayElement(agents);
    const customerOrders = orders.filter((o) => String(o.customerId) === String(customer._id));
    const order = category === 'orders' && customerOrders.length ? faker.helpers.arrayElement(customerOrders) : undefined;

    const ticket = {
      _id: new Types.ObjectId(),
      number: i + 1,
      subject: faker.helpers.arrayElement(ticketTopics[category]),
      customerId: customer._id,
      createdBy: author._id,
      ...(assignee && { assignee: assignee._id }),
      status,
      priority: faker.helpers.weightedArrayElement([
        { weight: 2, value: 'low' },
        { weight: 4, value: 'medium' },
        { weight: 2, value: 'high' },
        { weight: 1, value: 'urgent' },
      ]),
      category,
      ...(order && { orderId: order._id }),
      createdAt,
    };

    const messageCount = faker.number.int({ min: 2, max: 6 });
    let at = createdAt.getTime();
    for (let m = 0; m < messageCount; m++) {
      const fromCustomer = m % 2 === 0;
      const internal = !fromCustomer && assignee && faker.datatype.boolean({ probability: 0.2 });
      const authorId = fromCustomer ? author._id : (assignee || faker.helpers.arrayElement(agents))._id;
      at = Math.min(now, at + faker.number.int({ min: 1, max: 30 }) * HOUR);
      messages.push({
        _id: new Types.ObjectId(),
        ticketId: ticket._id,
        authorId,
        body:
          m === 0
            ? faker.lorem.paragraph({ min: 2, max: 4 })
            : internal
              ? faker.helpers.arrayElement(internalNotes)
              : faker.helpers.arrayElement(fromCustomer ? customerReplies : agentReplies),
        internal: Boolean(internal),
        attachments: [],
        createdAt: new Date(at),
        updatedAt: new Date(at),
      });
    }

    ticket.updatedAt = new Date(at);
    if (status === 'resolved' || status === 'closed') ticket.resolvedAt = new Date(Math.min(now, at + faker.number.int({ min: 1, max: 2 }) * DAY));
    tickets.push(ticket);
  }
  return { tickets, messages };
}

module.exports = { generateTickets };
