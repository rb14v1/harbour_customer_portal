const { Types } = require('mongoose');
const { products } = require('../data/catalog');

const TAX_RATE = 0.08;
const DAY = 24 * 60 * 60 * 1000;
const round = (n) => Math.round(n * 100) / 100;

function generateOrders(faker, customers, count) {
  const now = Date.now();
  const orders = Array.from({ length: count }, () => {
    const picks = faker.helpers.arrayElements(products, { min: 1, max: 4 });
    const items = picks.map(([sku, name, price]) => ({ sku, name, qty: faker.number.int({ min: 1, max: 10 }), unitPrice: price }));
    const subtotal = round(items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0));
    const tax = round(subtotal * TAX_RATE);
    const placedAt = new Date(now - faker.number.int({ min: 1, max: 365 }) * DAY);
    const ageDays = (now - placedAt) / DAY;

    let status;
    if (ageDays < 3) status = faker.helpers.arrayElement(['pending', 'processing']);
    else if (ageDays < 10) status = faker.helpers.arrayElement(['processing', 'shipped']);
    else status = faker.helpers.weightedArrayElement([
      { weight: 9, value: 'delivered' },
      { weight: 1, value: 'cancelled' },
    ]);

    return {
      _id: new Types.ObjectId(),
      customerId: faker.helpers.arrayElement(customers)._id,
      items,
      status,
      subtotal,
      tax,
      total: round(subtotal + tax),
      placedAt,
      createdAt: placedAt,
      updatedAt: placedAt,
    };
  });

  orders.sort((a, b) => a.placedAt - b.placedAt);
  orders.forEach((o, i) => {
    o.number = `SO-${10001 + i}`;
    o.externalId = `ERP-O-${50001 + i}`;
  });
  return orders;
}

function generateInvoices(faker, orders) {
  const now = Date.now();
  const invoices = [];
  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'pending') continue;
    const issuedAt = new Date(order.placedAt.getTime() + DAY);
    const dueDate = new Date(issuedAt.getTime() + 30 * DAY);
    const pastDue = dueDate.getTime() < now;

    let status = 'unpaid';
    let paidAt;
    if (faker.datatype.boolean({ probability: pastDue ? 0.85 : 0.3 })) {
      status = 'paid';
      paidAt = new Date(Math.min(now, issuedAt.getTime() + faker.number.int({ min: 2, max: 35 }) * DAY));
    } else if (pastDue) {
      status = 'overdue';
    }

    invoices.push({
      _id: new Types.ObjectId(),
      orderId: order._id,
      customerId: order.customerId,
      lines: order.items.map((it) => ({ description: `${it.sku} — ${it.name}`, qty: it.qty, unitPrice: it.unitPrice })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status,
      issuedAt,
      dueDate,
      ...(paidAt && { paidAt }),
      createdAt: issuedAt,
      updatedAt: paidAt || issuedAt,
    });
  }
  invoices.forEach((inv, i) => {
    inv.number = `INV-${20001 + i}`;
    inv.externalId = `ERP-I-${70001 + i}`;
  });
  return invoices;
}

module.exports = { generateOrders, generateInvoices };
