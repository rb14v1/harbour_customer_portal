const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

async function connectDb(uri = env.MONGO_URI) {
  mongoose.set('strictQuery', true);
  // Indexes are owned by migrations outside of tests.
  mongoose.set('autoIndex', env.NODE_ENV === 'test');
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
}

async function disconnectDb() {
  await mongoose.disconnect();
}

module.exports = { connectDb, disconnectDb };
