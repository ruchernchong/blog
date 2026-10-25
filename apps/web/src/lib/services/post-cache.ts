import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import { getPostsWithOverlappingTags } from "@/lib/queries/overlapping-posts";

/**
 * Framework-free post cache invalidation. Each function does the Redis work and
 * hands the Cache Components tags to `revalidateTags`, so the Next.js app
 * (`cache-invalidation.ts`) and the MCP server, which must not import
 * `next/*`, bust exactly the same tags.
 */
type RevalidateTags = (tags: string[]) => void | Promise<void>;

export async function invalidatePostCache(
  slug: string,
  revalidateTags: RevalidateTags,
): Promise<void> {
  await redis.del(CacheConfig.REDIS_KEYS.POST_STATS(slug));

  await revalidateTags([
    `post:${slug}`,
    `mdx:${slug}`,
    `related:${slug}`,
    "posts:list",
    "posts:count",
    "posts:featured",
  ]);
}

/**
 * Invalidate related post caches for all posts with overlapping tags
 *
 * Used when a post's tags are modified - all posts that might have
 * calculated similarity with this post need their caches cleared.
 *
 * @param tags - Tags to find overlapping posts for
 * @param excludeSlug - Optional slug to exclude from invalidation
 * @param revalidateTags - Revalidates the collected cache tags
 */
export async function invalidateRelatedCacheByTags(
  tags: string[],
  excludeSlug: string | undefined,
  revalidateTags: RevalidateTags,
): Promise<void> {
  if (!tags.length) return;

  // Find all posts that share at least one tag
  const postsWithTags = await getPostsWithOverlappingTags(
    tags,
    excludeSlug || "",
  );
  if (!postsWithTags.length) return;

  // Invalidate related cache for each overlapping post. The related list is
  // embedded in the cached article (post:${slug}), so bust that too.
  await revalidateTags(
    postsWithTags.flatMap((post) => [
      `related:${post.slug}`,
      `post:${post.slug}`,
    ]),
  );
}

/**
 * Remove a post from popular sorted set
 *
 * @param slug - Post slug to remove
 */
async function removeFromPopular(slug: string): Promise<void> {
  await redis.zrem(CacheConfig.REDIS_KEYS.POPULAR_SET, slug);
}

/**
 * Remove post from popular sorted set and invalidate its caches
 *
 * Used when a post is deleted or unpublished.
 *
 * @param slug - Post slug to remove
 * @param revalidateTags - Revalidates the collected cache tags
 */
export async function invalidatePopularPostCache(
  slug: string,
  revalidateTags: RevalidateTags,
): Promise<void> {
  await Promise.all([
    removeFromPopular(slug),
    invalidatePostCache(slug, revalidateTags),
  ]);
}
