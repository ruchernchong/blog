import { CacheConfig } from "@/lib/config/cache.config";
import { getPostsWithOverlappingTags } from "@/lib/queries/posts";
import type { CacheService } from "@/lib/services/cache.service";
import type { PopularPostsService } from "@/lib/services/popular-posts.service";

/**
 * CacheInvalidationService - Manages cache invalidation for post-related caches.
 *
 * Handles:
 * - Single post cache invalidation (stats, related)
 * - Tag-based invalidation (when tags change)
 * - Popular posts removal (on delete)
 * - Bulk invalidation operations
 *
 * When to invalidate:
 * - Post update (especially tag changes) → invalidate related caches
 * - Post delete → remove from popular, invalidate related
 * - Post publish/unpublish → invalidate related posts with same tags
 *
 * @example
 * ```typescript
 * const service = new CacheInvalidationService(cache, popularService);
 * await service.invalidatePost('my-post-slug');
 * await service.invalidateRelatedByTags(['typescript', 'react']);
 * ```
 */
export class CacheInvalidationService {
  constructor(
    private readonly cache: CacheService,
    private readonly popularService: PopularPostsService,
  ) {}

  /**
   * Invalidate all caches for a single post
   *
   * Clears:
   * - Post statistics (views, likes)
   * - Related posts cache
   *
   * @param slug - Post slug to invalidate
   */
  async invalidatePost(slug: string): Promise<void> {
    const keysToDelete = [
      CacheConfig.REDIS_KEYS.POST_STATS(slug),
      CacheConfig.REDIS_KEYS.RELATED_CACHE(slug),
    ];

    await this.cache.del(keysToDelete);
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
  async invalidateRelatedByTags(
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
      await this.cache.del(keysToDelete);
    }
  }

  /**
   * Remove post from popular sorted set and invalidate its caches
   *
   * Used when a post is deleted or unpublished.
   *
   * @param slug - Post slug to remove
   */
  async invalidatePopularPost(slug: string): Promise<void> {
    await Promise.all([
      this.popularService.removeFromPopular(slug),
      this.invalidatePost(slug),
    ]);
  }

  /**
   * Invalidate all post-related caches
   *
   * WARNING: This is a destructive operation. Use only for:
   * - Testing/development
   * - Major data migrations
   * - Emergency cache clearing
   *
   * Does NOT clear the popular posts sorted set to preserve view counts.
   */
  async invalidateAll(): Promise<void> {
    // Note: Redis doesn't have a built-in way to delete by pattern
    // This is a simplified version - in production, you might want to
    // use Redis SCAN with pattern matching or track keys separately
    console.warn(
      "invalidateAll() called - this should only be used in development",
    );

    // For now, we'll rely on TTLs to expire caches naturally
    // A full implementation would require tracking all cache keys
  }
}
