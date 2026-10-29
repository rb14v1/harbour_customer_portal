const AppError = require('../utils/AppError');

// Replaces req[part] with the parsed (coerced/defaulted) value.
const validate = (schemas) => (req, res, next) => {
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part]);
    if (!result.success) {
      return next(new AppError(400, 'Validation failed', result.error.flatten().fieldErrors));
    }
    if (part === 'query') {
      Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
    } else {
      req[part] = result.data;
    }
  }
  next();
};

module.exports = validate;
