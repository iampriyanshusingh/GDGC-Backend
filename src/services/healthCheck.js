import cron from 'node-cron';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('health-check');

class HealthCheckService {
  constructor() {
    this.services = {
      'user-service': {
        url: process.env.USER_SERVICE_URL,
        healthy: false,
        lastCheck: null,
        responseTime: null,
        failureCount: 0
      },
      'order-service': {
        url: process.env.ORDER_SERVICE_URL,
        healthy: false,
        lastCheck: null,
        responseTime: null,
        failureCount: 0
      },
      'payment-service': {
        url: process.env.PAYMENT_SERVICE_URL,
        healthy: false,
        lastCheck: null,
        responseTime: null,
        failureCount: 0
      }
    };
    
    this.maxFailures = 3;
    this.timeout = 5000; // 5 seconds timeout
  }

  async checkService(serviceName, serviceConfig) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(`${serviceConfig.url}/health`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      if (isHealthy) {
        serviceConfig.healthy = true;
        serviceConfig.failureCount = 0;
        serviceConfig.responseTime = responseTime;
        logger.info(`Health check passed for ${serviceName} (${responseTime}ms)`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      serviceConfig.failureCount += 1;
      serviceConfig.responseTime = Date.now() - startTime;
      
      if (serviceConfig.failureCount >= this.maxFailures) {
        serviceConfig.healthy = false;
        logger.error(`Health check failed for ${serviceName}: ${error.message} (${serviceConfig.failureCount} failures)`);
      } else {
        logger.warn(`Health check failed for ${serviceName}: ${error.message} (${serviceConfig.failureCount}/${this.maxFailures} failures)`);
      }
    }
    
    serviceConfig.lastCheck = new Date().toISOString();
  }

  async checkAllServices() {
    logger.info('Running health checks for all services...');
    
    const checks = Object.entries(this.services).map(([name, config]) =>
      this.checkService(name, config)
    );
    
    await Promise.allSettled(checks);
  }

  getHealthyServices(serviceName) {
    if (serviceName) {
      const service = this.services[serviceName];
      return service && service.healthy ? [service] : [];
    }
    
    return Object.entries(this.services)
      .filter(([name, config]) => config.healthy)
      .map(([name, config]) => ({ name, ...config }));
  }

  getServiceUrl(serviceName) {
    const service = this.services[serviceName];
    
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    if (!service.healthy) {
      throw new Error(`Service ${serviceName} is currently unavailable`);
    }
    
    return service.url;
  }

  getServiceStatuses() {
    return Object.fromEntries(
      Object.entries(this.services).map(([name, config]) => [
        name,
        {
          healthy: config.healthy,
          lastCheck: config.lastCheck,
          responseTime: config.responseTime,
          failureCount: config.failureCount,
          url: config.url
        }
      ])
    );
  }

  startMonitoring() {
    // Run initial health checks
    this.checkAllServices();
    
    // Schedule health checks every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      await this.checkAllServices();
    });
    
    logger.info('Health check monitoring started (every 30 seconds)');
  }
}

export const healthCheckService = new HealthCheckService();