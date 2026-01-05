import { cacheLife, cacheTag } from "next/cache";
import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import {
  getPostBySlug,
  getPostsWithOverlappingTags,
} from "@/lib/queries/posts";

export interface RelatedPost {
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: Date | null;
  commonTagCount: number;
  similarity: number;
}

/**
 * Get related posts for a given post slug
 *
 * Uses Jaccard similarity on tags to find related posts.
 * Results are cached in Redis with 24-hour TTL.
 *
 * @param slug - Post slug to find related posts for
 * @param limit - Maximum number of related posts to return
 * @returns Array of related posts sorted by similarity score
 */
export async function getRelatedPosts(
  slug: string,
  limit: number = CacheConfig.RELATED_POSTS.LIMIT,
): Promise<RelatedPost[]> {
  "use cache";
  cacheLife("max");
  cacheTag(`post:${slug}`);

  // Check cache first
  const cached = await getCachedRelated(slug);
  if (cached) return cached.slice(0, limit);

  // Fetch current post tags
  const currentPost = await getPostBySlug(slug);

  if (!currentPost || !currentPost.tags.length) return [];

  // Find posts with overlapping tags
  const relatedPosts = await getPostsWithOverlappingTags(
    currentPost.tags,
    slug,
  );

  // Calculate Jaccard similarity for each post
  const withSimilarity = relatedPosts
    .map((post) => {
      const commonTags = post.tags.filter((tag) =>
        currentPost.tags.includes(tag),
      );
      const similarity = calculateJaccardSimilarity(
        currentPost.tags,
        post.tags,
      );

      return {
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        publishedAt: post.publishedAt,
        commonTagCount: commonTags.length,
        similarity,
      };
    })
    .filter(
      (post) => post.similarity >= CacheConfig.RELATED_POSTS.MIN_SIMILARITY,
    );

  // Sort by similarity and limit
  const results = withSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  // Cache for 24 hours
  await cacheRelated(slug, results);

  return results;
}

/**
 * Calculate Jaccard similarity coefficient between two tag sets
 *
 * Formula: J(A, B) = |A ∩ B| / |A ∪ B|
 *
 * @param tags1 - First set of tags
 * @param tags2 - Second set of tags
 * @returns Similarity score between 0 and 1
 */
function calculateJaccardSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 && tags2.length === 0) return 0;

  const commonTags = tags1.filter((tag) => tags2.includes(tag));
  const unionSize = new Set([...tags1, ...tags2]).size;

  if (unionSize === 0) return 0;

  return commonTags.length / unionSize;
}

/**
 * Get cached related posts
 *
 * @param slug - Post slug
 * @returns Cached related posts or null
 */
async function getCachedRelated(slug: string): Promise<RelatedPost[] | null> {
  const cacheKey = CacheConfig.REDIS_KEYS.RELATED_CACHE(slug);
  return redis.get<RelatedPost[]>(cacheKey);
}

/**
 * Cache related posts with TTL
 *
 * @param slug - Post slug
 * @param posts - Related posts to cache
 */
async function cacheRelated(slug: string, posts: RelatedPost[]): Promise<void> {
  const cacheKey = CacheConfig.REDIS_KEYS.RELATED_CACHE(slug);
  await redis.set(cacheKey, posts, {
    ex: CacheConfig.RELATED_POSTS.TTL,
  });
}
