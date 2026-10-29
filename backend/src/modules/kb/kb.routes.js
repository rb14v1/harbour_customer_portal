const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { auth, requireRole } = require('../../middleware/auth');
const schemas = require('./kb.schemas');
const service = require('./kb.service');

const staff = requireRole('agent', 'admin');

router.use(auth);

router.get('/categories', asyncHandler(async (req, res) => res.json(await service.listCategories())));
router.get('/articles', validate(schemas.list), asyncHandler(async (req, res) => res.json(await service.listArticles(req.user, req.query))));
router.get('/articles/:slug', validate(schemas.slug), asyncHandler(async (req, res) => res.json(await service.getBySlug(req.user, req.params.slug))));
router.post('/articles/:id/vote', validate(schemas.vote), asyncHandler(async (req, res) => res.json(await service.vote(req.params.id, req.body.helpful))));

router.post('/articles', staff, validate(schemas.create), asyncHandler(async (req, res) => res.status(201).json(await service.create(req.user, req.body))));
router.patch('/articles/:id', staff, validate(schemas.update), asyncHandler(async (req, res) => res.json(await service.update(req.user, req.params.id, req.body))));
router.delete(
  '/articles/:id',
  staff,
  validate(schemas.id),
  asyncHandler(async (req, res) => {
    await service.remove(req.user, req.params.id);
    res.status(204).end();
  }),
);

module.exports = router;
