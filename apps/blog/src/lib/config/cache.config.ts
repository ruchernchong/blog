/**
 * Cache configuration constants for Redis operations.
 *
 * Centralizes all cache-related configuration including:
 * - Time-to-live (TTL) values
 * - Default limits for queries
 * - Redis key patterns
 * - Similarity thresholds
 */
export const CacheConfig = {
  /**
   * Configuration for related posts feature
   */
  RELATED_POSTS: {
    /** Maximum number of related posts to return */
    LIMIT: 4,
    /** Cache duration in seconds (24 hours) */
    TTL: 86400,
    /** Minimum Jaccard similarity score to include a post (0.0 - 1.0) */
    MIN_SIMILARITY: 0.1,
  } as const,

  /**
   * Redis key patterns for consistent key naming
   */
  REDIS_KEYS: {
    /** Cached related posts list */
    RELATED_CACHE: (slug: string) => `post:${slug}:related`,
  } as const,
} as const;
