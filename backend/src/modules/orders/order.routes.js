const router = require('express').Router();
const { z } = require('zod');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const AppError = require('../../utils/AppError');
const { auth } = require('../../middleware/auth');
const { paginate, paginationQuery } = require('../../utils/pagination');
const { scopeFilter } = require('../../utils/scope');
const { objectId } = require('../users/user.schemas');
const Order = require('./order.model');

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const listSchema = {
  query: z.object({
    ...paginationQuery,
    status: z.enum(STATUSES).optional(),
    customerId: objectId.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    q: z.string().trim().max(50).optional(),
  }),
};

router.use(auth);

router.get(
  '/',
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const { status, customerId, from, to, q, page, limit } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (from || to) filter.placedAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
    if (q) filter.number = new RegExp(q.replace(/[^\w-]/g, ''), 'i');
    res.json(
      await paginate(Order, scopeFilter(req.user, filter), {
        page,
        limit,
        sort: { placedAt: -1 },
        populate: { path: 'customerId', select: 'name' },
      }),
    );
  }),
);

router.get(
  '/:id',
  validate({ params: z.object({ id: objectId }) }),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne(scopeFilter(req.user, { _id: req.params.id })).populate('customerId', 'name').lean();
    if (!order) throw new AppError(404, 'Order not found');
    res.json(order);
  }),
);

module.exports = router;
