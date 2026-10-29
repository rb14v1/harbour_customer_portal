const router = require('express').Router();
const { z } = require('zod');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const AppError = require('../../utils/AppError');
const { auth } = require('../../middleware/auth');
const { paginate, paginationQuery } = require('../../utils/pagination');
const { scopeFilter } = require('../../utils/scope');
const { writeInvoicePdf } = require('../../utils/pdf');
const { objectId } = require('../users/user.schemas');
const Customer = require('../customers/customer.model');
const Invoice = require('./invoice.model');

const listSchema = {
  query: z.object({
    ...paginationQuery,
    status: z.enum(['unpaid', 'paid', 'overdue']).optional(),
    customerId: objectId.optional(),
  }),
};
const idSchema = { params: z.object({ id: objectId }) };

async function findScoped(user, id) {
  const invoice = await Invoice.findOne(scopeFilter(user, { _id: id })).populate('orderId', 'number').lean();
  if (!invoice) throw new AppError(404, 'Invoice not found');
  return invoice;
}

router.use(auth);

router.get(
  '/',
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const { status, customerId, page, limit } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    res.json(
      await paginate(Invoice, scopeFilter(req.user, filter), {
        page,
        limit,
        sort: { issuedAt: -1 },
        populate: { path: 'customerId', select: 'name' },
      }),
    );
  }),
);

router.get('/:id', validate(idSchema), asyncHandler(async (req, res) => res.json(await findScoped(req.user, req.params.id))));

router.get(
  '/:id/pdf',
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const invoice = await findScoped(req.user, req.params.id);
    const customer = await Customer.findById(invoice.customerId).lean();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.number}.pdf"`);
    writeInvoicePdf(invoice, customer || { name: 'Unknown customer' }, res);
  }),
);

module.exports = router;
