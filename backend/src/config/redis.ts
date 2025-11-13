import Redis from 'ioredis';
import { config } from './env';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// Only create Redis connection if REDIS_URL is set and not localhost (for production)
const shouldUseRedis = config.redis.url && 
  config.redis.url !== 'redis://localhost:6379' && 
  !config.redis.url.includes('127.0.0.1');

let redisInstance: Redis | null = null;

if (shouldUseRedis) {
  redisInstance =
    globalForRedis.redis ??
    new Redis(config.redis.url, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true, // Don't connect immediately
      enableOfflineQueue: false, // Don't queue commands if disconnected
    });

  if (config.nodeEnv !== 'production') {
    globalForRedis.redis = redisInstance;
  }

  redisInstance.on('error', (err) => {
    console.error('Redis Client Error:', err);
    // Don't crash the app, just log the error
  });

  redisInstance.on('connect', () => {
    console.log('Redis Client Connected');
  });

  // Try to connect, but don't fail if it doesn't
  redisInstance.connect().catch((err) => {
    console.warn('Redis connection failed, continuing without cache:', err.message);
    redisInstance = null;
  });
} else {
  console.log('Redis disabled (REDIS_URL not configured or using localhost)');
}

// Export a wrapper that handles Redis being unavailable
export const redis = {
  get: async (key: string): Promise<string | null> => {
    if (!redisInstance) return null;
    try {
      return await redisInstance.get(key);
    } catch (err) {
      console.warn('Redis get failed, returning null:', err);
      return null;
    }
  },
  setex: async (key: string, seconds: number, value: string): Promise<void> => {
    if (!redisInstance) return;
    try {
      await redisInstance.setex(key, seconds, value);
    } catch (err) {
      console.warn('Redis setex failed, ignoring:', err);
    }
  },
  del: async (key: string): Promise<void> => {
    if (!redisInstance) return;
    try {
      await redisInstance.del(key);
    } catch (err) {
      console.warn('Redis del failed, ignoring:', err);
    }
  },
};

export default redis;

