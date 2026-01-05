import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import { getPublishedPostsBySlugs } from "@/lib/queries/posts";
import { db, type PostMetadata, posts } from "@/schema";

export interface PopularPost {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: Date | null;
  metadata: PostMetadata;
  views: number;
}

/**
 * Get top N popular posts by view count
 *
 * Fetches from Redis sorted set, merges with database post data.
 * Falls back to recent posts if Redis is unavailable.
 *
 * @param limit - Maximum number of posts to return
 * @returns Array of popular posts with view counts
 */
export async function getPopularPosts(
  limit: number = CacheConfig.POPULAR_POSTS.LIMIT,
): Promise<PopularPost[]> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  // Get top N from sorted set (highest scores first)
  const results = await redis.zrange(
    CacheConfig.REDIS_KEYS.POPULAR_SET,
    0,
    limit - 1,
    {
      rev: true,
      withScores: true,
    },
  );

  // Fallback to recent posts if Redis fails or returns empty
  if (!results || results.length === 0) {
    return getFallbackPosts(limit);
  }

  // Parse results - zrange with withScores returns alternating member/score values
  const parsedResults: Array<{ member: string; score: number }> = [];
  for (let i = 0; i < results.length; i += 2) {
    parsedResults.push({
      member: results[i] as string,
      score: Number(results[i + 1]),
    });
  }

  const slugs = parsedResults.map((r) => r.member);

  // Fetch full post data from DB
  const popularPosts = await getPublishedPostsBySlugs(slugs);

  // Merge with view counts and sort by views
  return popularPosts
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      publishedAt: post.publishedAt,
      metadata: post.metadata,
      views: parsedResults.find((r) => r.member === post.slug)?.score || 0,
    }))
    .sort((a, b) => b.views - a.views);
}

/**
 * Update popular score for a post
 *
 * @param slug - Post slug
 * @param views - New view count
 */
export async function updatePopularScore(
  slug: string,
  views: number,
): Promise<void> {
  await redis.zadd(CacheConfig.REDIS_KEYS.POPULAR_SET, {
    score: views,
    member: slug,
  });
}

/**
 * Remove a post from popular sorted set
 *
 * @param slug - Post slug to remove
 */
export async function removeFromPopular(slug: string): Promise<void> {
  await redis.zrem(CacheConfig.REDIS_KEYS.POPULAR_SET, slug);
}

/**
 * Fallback to recent published posts when Redis is unavailable
 *
 * @param limit - Maximum number of posts to return
 * @returns Array of recent posts with zero views
 */
async function getFallbackPosts(limit: number): Promise<PopularPost[]> {
  const recentPosts = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.status, "published"),
        isNotNull(posts.publishedAt),
        isNull(posts.deletedAt),
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return recentPosts.map((post) => ({
    ...post,
    views: 0,
  }));
}
