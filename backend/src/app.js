const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', apiLimiter);
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/user.routes'));
app.use('/api/customers', require('./modules/customers/customer.routes'));
app.use('/api/orders', require('./modules/orders/order.routes'));
app.use('/api/invoices', require('./modules/invoices/invoice.routes'));
app.use('/api/tickets', require('./modules/tickets/ticket.routes'));
app.use('/api/kb', require('./modules/kb/kb.routes'));
app.use('/api/metrics', require('./modules/metrics/metrics.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
