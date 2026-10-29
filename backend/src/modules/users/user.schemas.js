const { z } = require('zod');
const { paginationQuery } = require('../../utils/pagination');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const role = z.enum(['customer', 'agent', 'admin']);

module.exports = {
  objectId,
  list: { query: z.object({ ...paginationQuery, role: role.optional(), q: z.string().trim().max(100).optional() }) },
  create: {
    body: z
      .object({
        email: z.string().trim().toLowerCase().email(),
        name: z.string().trim().min(1).max(100),
        role,
        password: z.string().min(8).max(128),
        customerId: objectId.optional(),
      })
      .refine((v) => v.role !== 'customer' || v.customerId, { message: 'customerId is required for customers', path: ['customerId'] }),
  },
  update: {
    params: z.object({ id: objectId }),
    body: z
      .object({
        name: z.string().trim().min(1).max(100).optional(),
        role: role.optional(),
        isActive: z.boolean().optional(),
        customerId: objectId.nullable().optional(),
      })
      .strict(),
  },
};
