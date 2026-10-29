const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
const ALLOWED = { 'image/png': '.png', 'image/jpeg': '.jpg', 'application/pdf': '.pdf' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + ALLOWED[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) return cb(new AppError(400, 'Only PNG, JPG and PDF files are allowed'));
    cb(null, true);
  },
});

module.exports = { upload, UPLOAD_DIR };
