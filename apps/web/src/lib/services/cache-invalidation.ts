import { revalidateTag } from "next/cache";
import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import { getPostsWithOverlappingTags } from "@/lib/queries/posts";
import { removeFromPopular } from "@/lib/services/popular-posts";

export async function invalidatePost(slug: string): Promise<void> {
  await redis.del(CacheConfig.REDIS_KEYS.POST_STATS(slug));

  // Invalidate Next.js Cache Components
  revalidateTag(`post:${slug}`, "max");
  revalidateTag(`mdx:${slug}`, "max");
  revalidateTag(`related:${slug}`, "max");
  revalidateTag("posts:list", "max");
  revalidateTag("posts:count", "max");
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

  // Invalidate related cache for each overlapping post
  for (const post of postsWithTags) {
    revalidateTag(`related:${post.slug}`, "max");
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
