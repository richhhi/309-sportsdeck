import { createClient, RedisClientType } from 'redis';

// Use a global variable to preserve the client between HMR reloads in development
const globalForRedis = global as unknown as { redisClient: RedisClientType };

export const redis =
  globalForRedis.redisClient ||
  createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisClient = redis;
}

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Redis Client Connected'));

// Ensure the client connects. In Next.js, it's safer to connect upon first use or initialize eagerly
if (!redis.isOpen) {
  redis.connect().catch(console.error);
}

/**
 * Retrieves cached data.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Redis get error for key ${key}:`, error);
    return null; // Fallback to avoid breaking API
  }
}

/**
 * Stores data in the cache.
 */
export async function setCachedData(key: string, data: any, expirationInSeconds: number = 60) {
  try {
    await redis.setEx(key, expirationInSeconds, JSON.stringify(data));
  } catch (error) {
    console.error(`Redis set error for key ${key}:`, error);
  }
}

/**
 * Invalidates cache by using SCAN for a pattern.
 */
export async function invalidateCachePattern(pattern: string) {
  try {
    const keysToDelete: string[] = [];
    for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(...keys);
    }
    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map(k => redis.unlink(k)));
      console.log(`Invalidated ${keysToDelete.length} cache keys matching ${pattern}`);
    }
  } catch (error) {
    console.error(`Redis invalidate pattern error for ${pattern}:`, error);
  }
}
