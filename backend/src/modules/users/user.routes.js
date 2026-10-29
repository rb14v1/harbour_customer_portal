const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { auth, requireRole } = require('../../middleware/auth');
const schemas = require('./user.schemas');
const service = require('./user.service');
const User = require('./user.model');

// Assignee picker for the ticket queue.
router.get(
  '/agents',
  auth,
  requireRole('agent', 'admin'),
  asyncHandler(async (req, res) => {
    res.json(await User.find({ role: { $in: ['agent', 'admin'] }, isActive: true }).select('name email role').sort({ name: 1 }).lean());
  }),
);

router.use(auth, requireRole('admin'));

router.get('/', validate(schemas.list), asyncHandler(async (req, res) => res.json(await service.list(req.query))));
router.post('/', validate(schemas.create), asyncHandler(async (req, res) => res.status(201).json(await service.create(req.user, req.body))));
router.patch('/:id', validate(schemas.update), asyncHandler(async (req, res) => res.json(await service.update(req.user, req.params.id, req.body))));

module.exports = router;
