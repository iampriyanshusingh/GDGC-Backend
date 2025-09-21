import { createProxyMiddleware } from 'http-proxy-middleware';
import { healthCheckService } from '../services/healthCheck.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('routes');

export const setupRoutes = (app) => {
  // User Service Routes
  app.use('/api/users', createServiceProxy('user-service', '/users'));
  
  // Order Service Routes  
  app.use('/api/orders', createServiceProxy('order-service', '/orders'));
  
  // Payment Service Routes
  app.use('/api/payments', createServiceProxy('payment-service', '/payments'));
  
  // Catch-all route for undefined endpoints
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.path
    });
  });
};

function createServiceProxy(serviceName, pathPrefix) {
  return createProxyMiddleware({
    target: 'http://placeholder', // Will be overridden by router
    changeOrigin: true,
    pathRewrite: {
      [`^/api${pathPrefix}`]: '' // Remove /api/service-name prefix
    },
    
    router: (req) => {
      try {
        const serviceUrl = healthCheckService.getServiceUrl(serviceName);
        logger.info(`Routing ${req.method} ${req.path} to ${serviceName} at ${serviceUrl}`);
        return serviceUrl;
      } catch (error) {
        logger.error(`Failed to route to ${serviceName}: ${error.message}`);
        throw error;
      }
    },
    
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}: ${err.message}`);
      
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: `Service ${serviceName} is currently unavailable`,
          error: 'SERVICE_UNAVAILABLE'
        });
      }
    },
    
    onProxyReq: (proxyReq, req, res) => {
      // Add user context to downstream services
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.userId);
        proxyReq.setHeader('X-Username', req.user.username);
      }
      
      // Add request ID for tracing
      const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
      proxyReq.setHeader('X-Request-ID', requestId);
      
      logger.info(`Forwarding request ${requestId} to ${serviceName}`);
    },
    
    onProxyRes: (proxyRes, req, res) => {
      const requestId = req.headers['x-request-id'] || 'unknown';
      logger.info(`Response from ${serviceName} for request ${requestId}: ${proxyRes.statusCode}`);
    }
  });
}