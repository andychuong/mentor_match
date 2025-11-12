import rateLimit from 'express-rate-limit';
// import { redis } from '../config/redis'; // Reserved for future custom Redis store implementation
import { config } from '../config/env';

// Memory store for rate limiting (fallback if Redis unavailable)
// Reserved for future use when implementing custom rate limiting store
// const _memoryStore = new Map<string, { count: number; resetTime: number }>();

// Redis store for rate limiting
// Reserved for future use when implementing custom rate limiting store
// const _redisStore = {
//   async increment(key: string): Promise<{ totalHits: number; timeToExpire: number }> {
//     const count = await redis.incr(key);
//     if (count === 1) {
//       await redis.expire(key, 60); // 60 seconds window
//     }
//     const ttl = await redis.ttl(key);
//     return { totalHits: count, timeToExpire: ttl };
//   },
// };

// Check if we're in development mode
const isDevelopment = config.nodeEnv === 'development';

// General API rate limiter
// Much more lenient in development mode
export const apiLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
  max: isDevelopment ? 1000 : 100, // 1000 requests per minute in dev, 100 per 15 min in prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment && process.env.DISABLE_RATE_LIMIT === 'true', // Allow disabling in dev
});

// Authentication rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
  max: isDevelopment ? 50 : 5, // 50 attempts per minute in dev, 5 per 15 min in prod
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => isDevelopment && process.env.DISABLE_RATE_LIMIT === 'true',
});

// Matching endpoint rate limiter
export const matchingLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 1000, // 1 minute
  max: isDevelopment ? 100 : 10, // 100 requests per minute in dev, 10 in prod
  message: 'Too many matching requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment && process.env.DISABLE_RATE_LIMIT === 'true',
});

