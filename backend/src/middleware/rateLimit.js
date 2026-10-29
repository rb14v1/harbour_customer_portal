const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const skip = () => env.NODE_ENV === 'test';

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false, skip });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, skip });

module.exports = { apiLimiter, authLimiter };
