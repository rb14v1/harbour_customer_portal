const { z } = require('zod');

const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

async function paginate(model, filter, { page, limit, sort = { createdAt: -1 }, populate, select }) {
  let query = model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);
  if (populate) query = query.populate(populate);
  if (select) query = query.select(select);
  const [data, total] = await Promise.all([query.lean(), model.countDocuments(filter)]);
  return { data, page, limit, total };
}

module.exports = { paginationQuery, paginate };
