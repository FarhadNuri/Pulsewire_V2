import { createClient } from 'redis';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Too many reconnection attempts');
            return new Error('Redis reconnection failed');
          }
          return retries * 100; // exponential backoff
        },
      },
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Return null if Redis is not available (graceful degradation)
    return null;
  }
}

/**
 * Get cached data from Redis
 * @param key - Cache key
 * @returns Parsed data or null if not found
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

/**
 * Set data in Redis cache with TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds (default: 6 hours)
 */
export async function setCachedData(
  key: string,
  data: any,
  ttlSeconds: number = 21600 // 6 hours default
): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.setEx(key, ttlSeconds, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

/**
 * Delete cached data from Redis
 * @param key - Cache key or pattern
 */
export async function deleteCachedData(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 * @param pattern - Redis key pattern (e.g., "news:*")
 */
export async function deleteCachedPattern(pattern: string): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;

    const deleted = await client.del(keys);
    return deleted;
  } catch (error) {
    console.error('Redis pattern delete error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  keys: number;
  memory: string;
} | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const info = await client.info('memory');
    const keys = await client.dbSize();
    
    // Parse memory usage from info string
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memory = memoryMatch ? memoryMatch[1] : 'unknown';

    return {
      connected: client.isOpen,
      keys,
      memory,
    };
  } catch (error) {
    console.error('Redis stats error:', error);
    return null;
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
}
