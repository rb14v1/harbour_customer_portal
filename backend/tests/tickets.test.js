const { app, startDb, stopDb, login, request } = require('./helpers');

let customer;
let agent;

beforeAll(async () => {
  await startDb();
  customer = await login('customer1@demo.local');
  agent = await login('agent1@demo.local');
});
afterAll(stopDb);

const as = (session) => ({
  get: (p) => request(app).get(p).set('Authorization', `Bearer ${session.token}`),
  post: (p) => request(app).post(p).set('Authorization', `Bearer ${session.token}`),
  patch: (p) => request(app).patch(p).set('Authorization', `Bearer ${session.token}`),
});

describe('tickets', () => {
  let ticketId;

  test('customer creates a ticket with the next number', async () => {
    const res = await as(customer).post('/api/tickets').send({ subject: 'Printer is on fire', body: 'Please help', priority: 'urgent', category: 'technical' });
    expect(res.status).toBe(201);
    expect(res.body.number).toBe(41);
    expect(res.body.status).toBe('open');
    ticketId = res.body._id;
  });

  test('agent internal note is hidden from the customer', async () => {
    const note = await as(agent).post(`/api/tickets/${ticketId}/messages`).field('body', 'Secret note').field('internal', 'true');
    expect(note.status).toBe(201);
    expect(note.body.internal).toBe(true);

    const view = await as(customer).get(`/api/tickets/${ticketId}`);
    expect(view.body.messages.map((m) => m.body)).not.toContain('Secret note');
  });

  test('agent reply moves ticket to pending and auto-assigns', async () => {
    const reply = await as(agent).post(`/api/tickets/${ticketId}/messages`).field('body', 'We are on it');
    expect(reply.status).toBe(201);
    const view = await as(customer).get(`/api/tickets/${ticketId}`);
    expect(view.body.status).toBe('pending');
    expect(view.body.assignee.email).toBe('agent1@demo.local');
    expect(view.body.messages.map((m) => m.body)).toContain('We are on it');
  });

  test('customer cannot assign or set priority', async () => {
    const res = await as(customer).patch(`/api/tickets/${ticketId}`).send({ priority: 'low' });
    expect(res.status).toBe(403);
  });

  test('agent resolves the ticket and resolvedAt is set', async () => {
    const res = await as(agent).patch(`/api/tickets/${ticketId}`).send({ status: 'resolved' });
    expect(res.status).toBe(200);
    expect(res.body.resolvedAt).toBeTruthy();
  });

  test('rejects disallowed attachment types', async () => {
    const res = await as(customer)
      .post(`/api/tickets/${ticketId}/messages`)
      .field('body', 'see attached')
      .attach('attachments', Buffer.from('MZ'), { filename: 'evil.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);
  });

  test('KB search returns published articles only for customers', async () => {
    const res = await as(customer).get('/api/kb/articles?q=password');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((a) => a.status === 'published')).toBe(true);
  });
});
