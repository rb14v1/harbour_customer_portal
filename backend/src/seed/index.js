const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const env = require('../config/env');
const logger = require('../config/logger');
const { connectDb, disconnectDb } = require('../config/db');
const User = require('../modules/users/user.model');
const RefreshToken = require('../modules/auth/refreshToken.model');
const Customer = require('../modules/customers/customer.model');
const Order = require('../modules/orders/order.model');
const Invoice = require('../modules/invoices/invoice.model');
const { Ticket, TicketMessage } = require('../modules/tickets/ticket.model');
const { KbCategory, KbArticle } = require('../modules/kb/kb.model');
const { Counter } = require('../modules/counters/counter.model');
const { AuditLog } = require('../modules/audit/audit.model');
const { generateCustomers, generateUsers } = require('./generators/users');
const { generateOrders, generateInvoices } = require('./generators/commerce');
const { generateTickets } = require('./generators/tickets');
const { generateKb } = require('./generators/kb');

const DEMO_PASSWORD = 'Password123!';
const DATA_MODELS = [User, RefreshToken, Customer, Order, Invoice, Ticket, TicketMessage, KbCategory, KbArticle, AuditLog];

async function seed({ reset = false } = {}) {
  if (env.NODE_ENV === 'production') throw new Error('Refusing to seed dummy data in production');

  if (reset) {
    await Promise.all(DATA_MODELS.map((m) => m.collection.deleteMany({})));
  } else if (await User.collection.countDocuments()) {
    throw new Error('Database already has data. Use `npm run seed:reset` to wipe and reseed.');
  }

  faker.seed(42);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const customers = generateCustomers(faker, 10);
  const users = generateUsers(faker, customers, passwordHash);
  const orders = generateOrders(faker, customers, 120);
  const invoices = generateInvoices(faker, orders);
  const { tickets, messages } = generateTickets(faker, { customers, users, orders, count: 40 });
  const { categories, articles } = generateKb(faker, users.filter((u) => u.role !== 'customer'));

  await Customer.collection.insertMany(customers);
  await User.collection.insertMany(users);
  await Order.collection.insertMany(orders);
  await Invoice.collection.insertMany(invoices);
  await Ticket.collection.insertMany(tickets);
  await TicketMessage.collection.insertMany(messages);
  await KbCategory.collection.insertMany(categories);
  await KbArticle.collection.insertMany(articles);

  const counters = { ticketNumber: tickets.length, orderNumber: orders.length, invoiceNumber: invoices.length };
  await Promise.all(
    Object.entries(counters).map(([name, seq]) => Counter.collection.updateOne({ _id: name }, { $set: { seq } }, { upsert: true })),
  );

  return {
    customers: customers.length,
    users: users.length,
    orders: orders.length,
    invoices: invoices.length,
    tickets: tickets.length,
    messages: messages.length,
    kbCategories: categories.length,
    kbArticles: articles.length,
  };
}

if (require.main === module) {
  (async () => {
    try {
      await connectDb();
      const counts = await seed({ reset: process.argv.includes('--reset') });
      logger.info(counts, 'Seed complete');
      logger.info(`Demo logins (password "${DEMO_PASSWORD}"): admin@demo.local, agent1@demo.local, customer1@demo.local`);
      await disconnectDb();
    } catch (err) {
      logger.error(err.message);
      await disconnectDb();
      process.exit(1);
    }
  })();
}

module.exports = { seed, DEMO_PASSWORD };
