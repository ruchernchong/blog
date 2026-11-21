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
 * One atomic `ZINCRBY` on the popular posts sorted set, which is the source of
 * truth for views. It survives post edits: `invalidatePostCache` deletes the
 * `post:<slug>` stats key, which used to reset the count to 1 on the next view.
 *
 * @param slug - Post slug
 * @returns The post's new view count
 */
export async function incrementViews(slug: string): Promise<number> {
  return redis.zincrby(CacheConfig.REDIS_KEYS.POPULAR_SET, 1, slug);
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

/**
 * Get all view counts from the popular posts sorted set
 *
 * @returns Map of slug to view count
 */
export async function getAllViewCounts(): Promise<Map<string, number>> {
  const results = await redis.zrange(
    CacheConfig.REDIS_KEYS.POPULAR_SET,
    0,
    -1,
    { withScores: true },
  );

  const viewMap = new Map<string, number>();
  for (let i = 0; i < results.length; i += 2) {
    viewMap.set(results[i] as string, Number(results[i + 1]));
  }
  return viewMap;
}
