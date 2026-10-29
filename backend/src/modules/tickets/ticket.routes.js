const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { auth } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');
const schemas = require('./ticket.schemas');
const service = require('./ticket.service');

router.use(auth);

router.get('/', validate(schemas.list), asyncHandler(async (req, res) => res.json(await service.list(req.user, req.query))));
router.post('/', validate(schemas.create), asyncHandler(async (req, res) => res.status(201).json(await service.create(req.user, req.body))));
router.get('/:id', validate(schemas.id), asyncHandler(async (req, res) => res.json(await service.get(req.user, req.params.id))));
router.patch('/:id', validate(schemas.update), asyncHandler(async (req, res) => res.json(await service.update(req.user, req.params.id, req.body))));

router.post(
  '/:id/messages',
  upload.array('attachments', 5),
  validate(schemas.message),
  asyncHandler(async (req, res) => res.status(201).json(await service.addMessage(req.user, req.params.id, req.body, req.files))),
);

router.get(
  '/:id/attachments/:filename',
  validate(schemas.attachment),
  asyncHandler(async (req, res) => {
    const file = await service.attachmentPath(req.user, req.params.id, req.params.filename);
    res.setHeader('Content-Type', file.mimeType);
    res.download(file.path, file.originalName);
  }),
);

module.exports = router;
