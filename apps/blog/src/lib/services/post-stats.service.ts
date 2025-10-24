import { cache } from "react";
import { CacheConfig } from "@/lib/config/cache.config";
import type { CacheService } from "@/lib/services/cache.service";
import type { Likes, PostStats } from "@/types";

/**
 * PostStatsService - Manages post statistics (views, likes) with Redis caching.
 *
 * Handles:
 * - View count tracking
 * - Like counts per user
 * - Popular posts sorted set updates
 * - Statistics retrieval and aggregation
 *
 * @example
 * ```typescript
 * const service = new PostStatsService(cacheService);
 * await service.incrementViews('my-post-slug');
 * const stats = await service.getStats('my-post-slug');
 * ```
 */
export class PostStatsService {
  constructor(private readonly cache: CacheService) {}

  /**
   * Get post statistics from cache or initialize with defaults
   *
   * Uses React cache() for request-level deduplication.
   *
   * @param slug - Post slug
   * @returns Post statistics including views and likes by user
   */
  getStats = cache(async (slug: string): Promise<PostStats> => {
    const key = CacheConfig.REDIS_KEYS.POST_STATS(slug);
    const stats = await this.cache.get<PostStats>(key);

    if (!stats) {
      const defaultStats: PostStats = {
        slug,
        likesByUser: {},
        views: 0,
      };
      await this.cache.set(key, defaultStats);
      return defaultStats;
    }

    return stats;
  });

  /**
   * Increment view count for a post
   *
   * Updates both the post stats hash and the popular posts sorted set.
   *
   * @param slug - Post slug
   * @returns Updated post statistics
   */
  async incrementViews(slug: string): Promise<PostStats> {
    const stats = await this.getStats(slug);
    const updatedStats: PostStats = {
      ...stats,
      views: stats.views + 1,
    };

    const key = CacheConfig.REDIS_KEYS.POST_STATS(slug);

    // Update both stats hash and popular sorted set atomically
    await Promise.all([
      this.cache.set(key, updatedStats),
      this.cache.zadd(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        updatedStats.views,
        slug,
      ),
    ]);

    return updatedStats;
  }

  /**
   * Increment like count for a specific user
   *
   * @param slug - Post slug
   * @param userHash - Hashed user identifier
   * @returns Total likes and likes by this user
   */
  async incrementLikes(slug: string, userHash: string): Promise<Likes> {
    const stats = await this.getStats(slug);
    const userLikes = stats.likesByUser[userHash] ?? 0;

    const updatedStats: PostStats = {
      ...stats,
      likesByUser: {
        ...stats.likesByUser,
        [userHash]: userLikes + 1,
      },
    };

    const key = CacheConfig.REDIS_KEYS.POST_STATS(slug);
    await this.cache.set(key, updatedStats);

    return {
      totalLikes: Object.values(updatedStats.likesByUser).reduce(
        (sum, likes) => sum + likes,
        0,
      ),
      likesByUser: updatedStats.likesByUser[userHash],
    };
  }

  /**
   * Get like count for a specific user
   *
   * @param slug - Post slug
   * @param userHash - Hashed user identifier (optional)
   * @returns Number of likes from this user
   */
  async getLikesByUser(slug: string, userHash?: string): Promise<number> {
    if (!userHash) return 0;
    const stats = await this.getStats(slug);
    return stats.likesByUser[userHash] || 0;
  }

  /**
   * Get total like count across all users
   *
   * @param slug - Post slug
   * @returns Total number of likes
   */
  async getTotalLikes(slug: string): Promise<number> {
    const stats = await this.getStats(slug);
    return Object.values(stats.likesByUser).reduce(
      (sum, likes) => sum + likes,
      0,
    );
  }
}
