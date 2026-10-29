const Order = require('../src/modules/orders/order.model');
const Invoice = require('../src/modules/invoices/invoice.model');
const { Ticket } = require('../src/modules/tickets/ticket.model');
const { app, startDb, stopDb, login, request } = require('./helpers');

let a;
let foreign;

beforeAll(async () => {
  await startDb();
  a = await login('customer1@demo.local');
  foreign = {
    order: await Order.findOne({ customerId: { $ne: a.user.customerId } }).lean(),
    invoice: await Invoice.findOne({ customerId: { $ne: a.user.customerId } }).lean(),
    ticket: await Ticket.findOne({ customerId: { $ne: a.user.customerId } }).lean(),
  };
});
afterAll(stopDb);

const get = (path) => request(app).get(path).set('Authorization', `Bearer ${a.token}`);

describe('tenant isolation', () => {
  test('order list only contains own orders, even when another customerId is requested', async () => {
    const res = await get(`/api/orders?limit=100&customerId=${foreign.order.customerId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((o) => String(o.customerId._id) === a.user.customerId)).toBe(true);
  });

  test("another customer's order is 404", async () => {
    expect((await get(`/api/orders/${foreign.order._id}`)).status).toBe(404);
  });

  test("another customer's invoice and PDF are 404", async () => {
    expect((await get(`/api/invoices/${foreign.invoice._id}`)).status).toBe(404);
    expect((await get(`/api/invoices/${foreign.invoice._id}/pdf`)).status).toBe(404);
  });

  test("another customer's ticket is 404", async () => {
    expect((await get(`/api/tickets/${foreign.ticket._id}`)).status).toBe(404);
  });

  test('own invoice PDF downloads', async () => {
    const own = await Invoice.findOne({ customerId: a.user.customerId }).lean();
    const res = await get(`/api/invoices/${own._id}/pdf`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });
});
