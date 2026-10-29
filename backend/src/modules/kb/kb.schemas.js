const { z } = require('zod');
const { paginationQuery } = require('../../utils/pagination');
const { objectId } = require('../users/user.schemas');

const articleBody = {
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(1).max(50000),
  categoryId: objectId,
  status: z.enum(['draft', 'published']),
};

module.exports = {
  list: {
    query: z.object({
      ...paginationQuery,
      q: z.string().trim().max(200).optional(),
      category: z.string().trim().max(100).optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  },
  slug: { params: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }) },
  id: { params: z.object({ id: objectId }) },
  vote: { params: z.object({ id: objectId }), body: z.object({ helpful: z.boolean() }) },
  create: { body: z.object({ ...articleBody, status: articleBody.status.default('draft') }) },
  update: { params: z.object({ id: objectId }), body: z.object(articleBody).partial().strict() },
};
