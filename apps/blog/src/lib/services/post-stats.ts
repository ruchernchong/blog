import { cache, cacheSignal } from "react";
import redis from "@/config/redis";
import type { PostStats } from "@/types";

export const getPostStats = cache(async (slug: string): Promise<PostStats> => {
  const signal = cacheSignal();
  const key = `post:${slug}`;

  // Listen for cache expiration
  if (signal) {
    signal.addEventListener("abort", () => {
      console.log(`[cacheSignal] Stats cache expired for post: ${slug}`);
    });
  }

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
});

export const getLikesByUser = async (
  slug: string,
  userHash?: string,
): Promise<number> => {
  if (!userHash) return 0;
  const stats = await getPostStats(slug);
  return stats.likesByUser[userHash] || 0;
};

export const getTotalLikes = async (slug: string): Promise<number> => {
  const stats = await getPostStats(slug);
  return Object.values(stats.likesByUser).reduce(
    (sum, likes) => sum + likes,
    0,
  );
};
