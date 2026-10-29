const mongoose = require('mongoose');
const multer = require('multer');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(404, 'Route not found'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof mongoose.Error.CastError) err = new AppError(404, 'Not found');
  if (err instanceof multer.MulterError) err = new AppError(400, err.message);
  if (err && err.code === 11000) err = new AppError(409, 'Duplicate value', err.keyValue);

  const status = err.status || 500;
  if (status >= 500) logger.error({ err }, 'Unhandled error');

  res.status(status).json({
    error: {
      message: status >= 500 ? 'Internal server error' : err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

module.exports = { notFound, errorHandler };
