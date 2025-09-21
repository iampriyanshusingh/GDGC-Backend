import { createLogger } from '../utils/logger.js';

const logger = createLogger('error-handler');

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.userId || 'anonymous'
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse = {
    success: false,
    message: 'An internal server error occurred',
    timestamp: new Date().toISOString()
  };

  if (isDevelopment) {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(500).json(errorResponse);
};