const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { auth } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimit');
const schemas = require('./auth.schemas');
const c = require('./auth.controller');

router.post('/login', authLimiter, validate(schemas.login), asyncHandler(c.login));
router.post('/refresh', asyncHandler(c.refresh));
router.post('/logout', asyncHandler(c.logout));
router.get('/me', auth, asyncHandler(c.me));
router.post('/forgot', authLimiter, validate(schemas.forgot), asyncHandler(c.forgot));
router.post('/reset', authLimiter, validate(schemas.reset), asyncHandler(c.reset));

module.exports = router;
