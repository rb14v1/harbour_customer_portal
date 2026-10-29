const { z } = require('zod');
const { paginationQuery } = require('../../utils/pagination');
const { objectId } = require('../users/user.schemas');
const { STATUSES, PRIORITIES, CATEGORIES } = require('./ticket.model');

const bool = z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean());

module.exports = {
  list: {
    query: z.object({
      ...paginationQuery,
      status: z.enum(STATUSES).optional(),
      priority: z.enum(PRIORITIES).optional(),
      assignee: z.union([objectId, z.literal('me'), z.literal('none')]).optional(),
      q: z.string().trim().max(100).optional(),
    }),
  },
  id: { params: z.object({ id: objectId }) },
  create: {
    body: z.object({
      subject: z.string().trim().min(3).max(200),
      body: z.string().trim().min(1).max(10000),
      priority: z.enum(PRIORITIES).default('medium'),
      category: z.enum(CATEGORIES).default('other'),
      orderId: objectId.optional(),
    }),
  },
  update: {
    params: z.object({ id: objectId }),
    body: z
      .object({
        status: z.enum(STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        assignee: objectId.nullable().optional(),
      })
      .strict(),
  },
  message: {
    params: z.object({ id: objectId }),
    body: z.object({
      body: z.string().trim().min(1).max(10000),
      internal: bool.optional().default(false),
    }),
  },
  attachment: {
    params: z.object({ id: objectId, filename: z.string().regex(/^[\w-]+\.(png|jpg|pdf)$/) }),
  },
};
