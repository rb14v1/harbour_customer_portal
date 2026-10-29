const { app, startDb, stopDb, login, request } = require('./helpers');

beforeAll(startDb);
afterAll(stopDb);

describe('auth', () => {
  test('health is public', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  test('rejects bad credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@demo.local', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('login returns access token and httpOnly refresh cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@demo.local', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: 'admin@demo.local', role: 'admin' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=.*HttpOnly/i);
  });

  test('protected routes require a token', async () => {
    expect((await request(app).get('/api/orders')).status).toBe(401);
  });

  test('refresh rotates the token and old token stops working', async () => {
    const { cookie } = await login('agent1@demo.local');
    const first = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(first.status).toBe(200);
    expect(first.body.accessToken).toBeTruthy();
    const reused = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(reused.status).toBe(401);
  });

  test('non-admin cannot manage users', async () => {
    const { token } = await login('agent1@demo.local');
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('admin can list users', async () => {
    const { token } = await login('admin@demo.local');
    const res = await request(app).get('/api/users?limit=100').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(24);
  });
});
