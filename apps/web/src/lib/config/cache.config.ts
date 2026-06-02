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
   * Configuration for popular posts feature
   */
  POPULAR_POSTS: {
    /** Maximum number of popular posts to return */
    LIMIT: 5,
    /** Fallback limit for recent posts when Redis is unavailable */
    FALLBACK_LIMIT: 10,
  } as const,

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
   * Configuration for post statistics
   */
  POST_STATS: {
    /** Cache duration for post stats in seconds (1 hour) */
    TTL: 3600,
  } as const,

  /**
   * Redis key patterns for consistent key naming
   */
  REDIS_KEYS: {
    /** Sorted set containing popular posts by view count */
    POPULAR_SET: "posts:popular",
    /** Hash containing post statistics (views, likes) */
    POST_STATS: (slug: string) => `post:${slug}`,
    /** Cached related posts list */
    RELATED_CACHE: (slug: string) => `post:${slug}:related`,
  } as const,
} as const;
