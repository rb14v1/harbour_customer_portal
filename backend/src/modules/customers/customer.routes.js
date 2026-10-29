const router = require('express').Router();
const { z } = require('zod');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { auth, requireRole } = require('../../middleware/auth');
const { paginate, paginationQuery } = require('../../utils/pagination');
const Customer = require('./customer.model');

const listSchema = { query: z.object({ ...paginationQuery, limit: paginationQuery.limit.default(100) }) };

router.get(
  '/',
  auth,
  requireRole('agent', 'admin'),
  validate(listSchema),
  asyncHandler(async (req, res) => {
    res.json(await paginate(Customer, {}, { ...req.query, sort: { name: 1 } }));
  }),
);

module.exports = router;
