const fs = require('fs');
const net = require('net');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = Number(process.env.MONGO_PORT) || 27018;
// Data lives on disk so it survives restarts, unlike the default in-memory mode.
const dbPath = path.resolve(__dirname, '../.mongo-data');

const portInUse = (port) =>
  new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    socket.once('connect', () => socket.end(() => resolve(true)));
    socket.once('error', () => resolve(false));
  });

(async () => {
  if (await portInUse(PORT)) {
    console.log(`MongoDB is already running on port ${PORT} - nothing to do. Stop the other terminal running "npm run db" first if you want to restart it.`);
    return;
  }
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({ instance: { port: PORT, dbPath, storageEngine: 'wiredTiger' } });
  console.log(`Local MongoDB running at ${mongod.getUri()} (data: ${dbPath}). Press Ctrl+C to stop.`);

  const stop = async () => {
    await mongod.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((err) => {
  console.error('Failed to start local MongoDB:', err.message);
  process.exit(1);
});
