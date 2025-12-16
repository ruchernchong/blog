/**
 * Service Container - Singleton instances of all cache-related services.
 *
 * These services are initialized once and reused throughout the application
 * to maintain consistent state and avoid redundant Redis connections.
 *
 * Services:
 * - CacheService: Low-level Redis operations with error handling
 * - RelatedPostsCalculator: Tag-based similarity calculation
 * - CacheInvalidationService: Cache invalidation operations
 *
 * @example
 * ```typescript
 * import { relatedPostsCalculator } from '@/lib/services';
 *
 * const related = await relatedPostsCalculator.getRelatedPosts('my-post', ['tag1']);
 * ```
 */

import redis from "@/config/redis";
import { CacheService } from "@/lib/services/cache.service";
import { CacheInvalidationService } from "@/lib/services/cache-invalidation.service";
import { RelatedPostsCalculator } from "@/lib/services/related-posts.service";

// Initialize base cache service
export const cacheService = new CacheService(redis);

// Initialize domain services
export const relatedPostsCalculator = new RelatedPostsCalculator(cacheService);

// Initialize cache invalidation service
export const cacheInvalidationService = new CacheInvalidationService(
  cacheService,
);

// Re-export service classes for testing purposes
export { CacheService } from "@/lib/services/cache.service";
export { CacheInvalidationService } from "@/lib/services/cache-invalidation.service";
export { RelatedPostsCalculator } from "@/lib/services/related-posts.service";
