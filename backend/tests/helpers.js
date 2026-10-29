const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const { connectDb, disconnectDb } = require('../src/config/db');
const { seed, DEMO_PASSWORD } = require('../src/seed');
const app = require('../src/app');

let mongod;

async function startDb() {
  mongod = await MongoMemoryServer.create();
  await connectDb(mongod.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  await seed({ reset: true });
}

async function stopDb() {
  await disconnectDb();
  if (mongod) await mongod.stop();
}

async function login(email, password = DEMO_PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status}`);
  return { token: res.body.accessToken, user: res.body.user, cookie: res.headers['set-cookie'] };
}

module.exports = { app, startDb, stopDb, login, request };
