import { createLogger } from '../utils/logger.js';

const logger = createLogger('request');

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
  req.headers['x-request-id'] = requestId;
  
  logger.info(`${req.method} ${req.url}`, {
    requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    user: req.user?.userId || 'anonymous'
  });

  // Log response when request finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
      requestId,
      duration: `${duration}ms`,
      user: req.user?.userId || 'anonymous'
    });
  });

  next();
};