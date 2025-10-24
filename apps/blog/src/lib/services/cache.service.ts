import type { Redis } from "@upstash/redis";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";

/**
 * CacheService - Wrapper around Redis client with error handling and graceful degradation.
 *
 * All Redis operations are wrapped with try-catch blocks to prevent application crashes
 * when Redis is unavailable. Failed operations return null or safe defaults.
 *
 * @example
 * ```typescript
 * const cache = new CacheService(redis);
 * const data = await cache.get<User>('user:123');
 * if (data) {
 *   // Use cached data
 * } else {
 *   // Fetch from database
 * }
 * ```
 */
export class CacheService {
  constructor(private readonly redis: Redis) {}

  /**
   * Get a value from cache
   *
   * @param key - Redis key
   * @returns Parsed value or null if key doesn't exist or error occurs
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.redis.get<T>(key);
    } catch (error) {
      logError(ERROR_IDS.CACHE_READ_FAILED, error, { key });
      return null;
    }
  }

  /**
   * Set a value in cache with optional expiration
   *
   * @param key - Redis key
   * @param value - Value to store
   * @param options - Optional settings like expiration time
   */
  async set<T>(key: string, value: T, options?: { ex: number }): Promise<void> {
    try {
      if (options) {
        await this.redis.set(key, value, options);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      logError(ERROR_IDS.CACHE_WRITE_FAILED, error, { key });
    }
  }

  /**
   * Delete one or more keys from cache
   *
   * @param keys - Single key or array of keys to delete
   */
  async del(keys: string | string[]): Promise<void> {
    try {
      if (Array.isArray(keys)) {
        await this.redis.del(...keys);
      } else {
        await this.redis.del(keys);
      }
    } catch (error) {
      logError(ERROR_IDS.CACHE_DELETE_FAILED, error, {
        keys: Array.isArray(keys) ? keys : [keys],
      });
    }
  }

  /**
   * Add member to sorted set with score
   *
   * @param key - Sorted set key
   * @param score - Score value
   * @param member - Member to add
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    try {
      await this.redis.zadd(key, { score, member });
    } catch (error) {
      logError(ERROR_IDS.CACHE_WRITE_FAILED, error, { key, score, member });
    }
  }

  /**
   * Get range of members from sorted set
   *
   * @param key - Sorted set key
   * @param start - Start index
   * @param stop - Stop index
   * @param options - Optional settings like reverse order, with scores
   * @returns Array of members or empty array on error
   */
  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: { rev?: boolean; withScores?: boolean },
  ): Promise<any[]> {
    try {
      return (await this.redis.zrange(key, start, stop, options)) ?? [];
    } catch (error) {
      logError(ERROR_IDS.CACHE_READ_FAILED, error, { key, start, stop });
      return [];
    }
  }

  /**
   * Remove member from sorted set
   *
   * @param key - Sorted set key
   * @param member - Member to remove
   */
  async zrem(key: string, member: string): Promise<void> {
    try {
      await this.redis.zrem(key, member);
    } catch (error) {
      logError(ERROR_IDS.CACHE_DELETE_FAILED, error, { key, member });
    }
  }

  /**
   * Check if Redis connection is healthy
   *
   * @returns true if Redis is reachable, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logError(ERROR_IDS.CACHE_CONNECTION_FAILED, error);
      return false;
    }
  }
}
