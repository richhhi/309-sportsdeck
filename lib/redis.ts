import { createClient, RedisClientType } from 'redis';

declare global {
  // eslint-disable-next-line no-var
  var redisClient: RedisClientType | undefined;
}

function createRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  // Redis Cloud uses rediss:// with a valid CA-signed cert — no extra TLS
  // config needed, the client handles it automatically from the URL scheme.
  const client = createClient({ url }) as RedisClientType;

  // Register listeners once, inside the factory, so they don't stack on
  // HMR reloads or multiple module evaluations.
  client.on('error', (err) => console.error('Redis Client Error', err));
  client.on('connect', () => console.log('Redis Client Connected'));

  // Initiate the connection. The client queues commands internally until
  // connected, so it's safe to call helper functions before this resolves.
  client.connect().catch(console.error);

  return client;
}

// Fix: assign unconditionally — singleton must be cached in both dev and prod.
export const redis = globalThis.redisClient ?? createRedisClient();
globalThis.redisClient = redis;

/**
 * Retrieves cached data.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (error) {
    console.error(`Redis get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Stores data in the cache with an optional TTL (default 60s).
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  expirationInSeconds: number = 60,
): Promise<void> {
  try {
    await redis.setEx(key, expirationInSeconds, JSON.stringify(data));
  } catch (error) {
    console.error(`Redis set error for key ${key}:`, error);
  }
}

/**
 * Invalidates all cache keys matching a pattern.
 * Uses a single variadic UNLINK command instead of one per key.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keysToDelete: string[] = [];
    for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(...keys);
    }
    if (keysToDelete.length > 0) {
      // Single UNLINK call — avoids N round-trips to Redis
      await redis.unlink(keysToDelete);
      console.log(`Invalidated ${keysToDelete.length} cache keys matching "${pattern}"`);
    }
  } catch (error) {
    console.error(`Redis invalidate pattern error for "${pattern}":`, error);
  }
}