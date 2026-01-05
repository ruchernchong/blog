import { cacheLife, cacheTag } from "next/cache";
import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import type { Likes, PostStats } from "@/types";

/**
 * Get post statistics from cache or initialize with defaults
 *
 * @param slug - Post slug
 * @returns Post statistics including views and likes by user
 */
export async function getPostStats(slug: string): Promise<PostStats> {
  "use cache";
  cacheLife("max");
  cacheTag(`post:${slug}`);

  const key = CacheConfig.REDIS_KEYS.POST_STATS(slug);
  const stats = await redis.get<PostStats>(key);

  if (!stats) {
    const defaultStats: PostStats = {
      slug,
      likesByUser: {},
      views: 0,
    };
    await redis.set(key, defaultStats);
    return defaultStats;
  }

  return stats;
}

/**
 * Increment view count for a post
 *
 * Updates both the post stats hash and the popular posts sorted set.
 *
 * @param slug - Post slug
 * @returns Updated post statistics
 */
export async function incrementViews(slug: string): Promise<PostStats> {
  const stats = await getPostStats(slug);
  const updatedStats: PostStats = {
    ...stats,
    views: stats.views + 1,
  };

  const key = CacheConfig.REDIS_KEYS.POST_STATS(slug);

  // Update both stats hash and popular sorted set atomically
  await Promise.all([
    redis.set(key, updatedStats),
    redis.zadd(CacheConfig.REDIS_KEYS.POPULAR_SET, {
      score: updatedStats.views,
      member: slug,
    }),
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
export async function incrementLikes(
  slug: string,
  userHash: string,
): Promise<Likes> {
  const stats = await getPostStats(slug);
  const userLikes = stats.likesByUser[userHash] ?? 0;

  const updatedStats: PostStats = {
    ...stats,
    likesByUser: {
      ...stats.likesByUser,
      [userHash]: userLikes + 1,
    },
  };

  const key = CacheConfig.REDIS_KEYS.POST_STATS(slug);
  await redis.set(key, updatedStats);

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
export async function getLikesByUser(
  slug: string,
  userHash?: string,
): Promise<number> {
  if (!userHash) return 0;
  const stats = await getPostStats(slug);
  return stats.likesByUser[userHash] || 0;
}

/**
 * Get total like count across all users
 *
 * @param slug - Post slug
 * @returns Total number of likes
 */
export async function getTotalLikes(slug: string): Promise<number> {
  const stats = await getPostStats(slug);
  return Object.values(stats.likesByUser).reduce(
    (sum, likes) => sum + likes,
    0,
  );
}
