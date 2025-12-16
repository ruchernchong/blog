/**
 * Service Container - Singleton instances of all cache-related services.
 *
 * These services are initialized once and reused throughout the application
 * to maintain consistent state and avoid redundant Redis connections.
 *
 * Services:
 * - CacheService: Low-level Redis operations with error handling
 * - PostStatsService: Post statistics (views, likes)
 * - PopularPostsService: Popular posts sorted set management
 * - RelatedPostsCalculator: Tag-based similarity calculation
 * - CacheInvalidationService: Cache invalidation operations
 *
 * @example
 * ```typescript
 * import { postStatsService, popularPostsService } from '@/lib/services';
 *
 * const stats = await postStatsService.getStats('my-post-slug');
 * const popular = await popularPostsService.getPopularPosts(5);
 * ```
 */

import redis from "@/config/redis";
import { CacheService } from "@/lib/services/cache.service";
import { CacheInvalidationService } from "@/lib/services/cache-invalidation.service";
import { PopularPostsService } from "@/lib/services/popular-posts.service";
import { PostStatsService } from "@/lib/services/post-stats.service";
import { RelatedPostsCalculator } from "@/lib/services/related-posts.service";

// Initialize base cache service
export const cacheService = new CacheService(redis);

// Initialize domain services
export const postStatsService = new PostStatsService(cacheService);
export const popularPostsService = new PopularPostsService(cacheService);
export const relatedPostsCalculator = new RelatedPostsCalculator(cacheService);

// Initialize cache invalidation service (depends on popular posts service)
export const cacheInvalidationService = new CacheInvalidationService(
  cacheService,
  popularPostsService,
);

// Re-export service classes for testing purposes
export { CacheService } from "@/lib/services/cache.service";
export { CacheInvalidationService } from "@/lib/services/cache-invalidation.service";
export { PopularPostsService } from "@/lib/services/popular-posts.service";
export { PostStatsService } from "@/lib/services/post-stats.service";
export { RelatedPostsCalculator } from "@/lib/services/related-posts.service";
