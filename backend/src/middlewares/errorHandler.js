const { errorResponse } = require('../utils/apiResponse');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err.stack || err);

  // PostgreSQL unique violation error code
  if (err.code === '23505') {
    return errorResponse(res, 'Record with this unique value already exists.', 409, {
      detail: err.detail,
    });
  }

  // PostgreSQL foreign key violation error code
  if (err.code === '23503') {
    return errorResponse(res, 'Referenced record not found.', 400, {
      detail: err.detail,
    });
  }

  // PostgreSQL invalid enum or invalid input syntax
  if (err.code === '22P02') {
    return errorResponse(res, 'Invalid data format provided.', 400, {
      detail: err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong on the server.';

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};

module.exports = errorHandler;
