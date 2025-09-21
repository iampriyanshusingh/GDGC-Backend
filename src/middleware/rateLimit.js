import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('rate-limit');

// Redis client for rate limiting
let redisClient;

const initRedisClient = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });
    
    await redisClient.connect();
    logger.info('Redis client connected for rate limiting');
  } catch (error) {
    logger.warn('Redis not available, using memory-based rate limiting');
    redisClient = null;
  }
};

// Initialize Redis client
initRedisClient();

// Custom rate limit store using Redis
class RedisRateLimitStore {
  constructor() {
    this.hits = new Map(); // Fallback to memory if Redis unavailable
  }

  async incr(key) {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    
    if (redisClient) {
      try {
        const redisKey = `rate_limit:${key}:${windowStart}`;
        const current = await redisClient.incr(redisKey);
        await redisClient.expire(redisKey, Math.ceil(windowMs / 1000));
        
        return {
          totalHits: current,
          timeToExpire: windowStart + windowMs - now
        };
      } catch (error) {
        logger.error('Redis error in rate limiting:', error);
        // Fall through to memory-based limiting
      }
    }
    
    // Fallback to memory-based rate limiting
    const memoryKey = `${key}:${windowStart}`;
    const current = (this.hits.get(memoryKey) || 0) + 1;
    this.hits.set(memoryKey, current);
    
    // Clean old entries
    setTimeout(() => {
      this.hits.delete(memoryKey);
    }, windowMs);
    
    return {
      totalHits: current,
      timeToExpire: windowStart + windowMs - now
    };
  }

  async resetKey(key) {
    if (redisClient) {
      try {
        const keys = await redisClient.keys(`rate_limit:${key}:*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
        return;
      } catch (error) {
        logger.error('Redis error resetting rate limit:', error);
      }
    }
    
    // Fallback to memory cleanup
    for (const [mapKey] of this.hits) {
      if (mapKey.startsWith(key)) {
        this.hits.delete(mapKey);
      }
    }
  }
}

const store = new RedisRateLimitStore();

export const rateLimitMiddleware = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  keyGenerator: (req) => {
    // Rate limit per user
    return req.user ? req.user.userId : req.ip;
  },
  
  handler: (req, res) => {
    const userId = req.user ? req.user.userId : req.ip;
    logger.warn(`Rate limit exceeded for user/IP: ${userId}`);
    
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.timeToExpire / 1000)
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  store: {
    incr: async (key) => {
      const result = await store.incr(key);
      return result;
    },
    decrement: () => {}, // Not implemented for simplicity
    resetKey: (key) => store.resetKey(key)
  }
});