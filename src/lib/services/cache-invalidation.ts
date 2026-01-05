import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import { getPostsWithOverlappingTags } from "@/lib/queries/posts";
import { removeFromPopular } from "@/lib/services/popular-posts";

/**
 * Invalidate all caches for a single post
 *
 * Clears:
 * - Post statistics (views, likes)
 * - Related posts cache
 *
 * @param slug - Post slug to invalidate
 */
export async function invalidatePost(slug: string): Promise<void> {
  const keysToDelete = [
    CacheConfig.REDIS_KEYS.POST_STATS(slug),
    CacheConfig.REDIS_KEYS.RELATED_CACHE(slug),
  ];

  await redis.del(...keysToDelete);
}

/**
 * Invalidate related post caches for all posts with overlapping tags
 *
 * Used when a post's tags are modified - all posts that might have
 * calculated similarity with this post need their caches cleared.
 *
 * @param tags - Tags to find overlapping posts for
 * @param excludeSlug - Optional slug to exclude from invalidation
 */
export async function invalidateRelatedByTags(
  tags: string[],
  excludeSlug?: string,
): Promise<void> {
  if (!tags.length) return;

  // Find all posts that share at least one tag
  const postsWithTags = await getPostsWithOverlappingTags(
    tags,
    excludeSlug || "",
  );

  // Invalidate related cache for each post
  const keysToDelete = postsWithTags.map((post) =>
    CacheConfig.REDIS_KEYS.RELATED_CACHE(post.slug),
  );

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
}

/**
 * Remove post from popular sorted set and invalidate its caches
 *
 * Used when a post is deleted or unpublished.
 *
 * @param slug - Post slug to remove
 */
export async function invalidatePopularPost(slug: string): Promise<void> {
  await Promise.all([removeFromPopular(slug), invalidatePost(slug)]);
}
