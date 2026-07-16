import { cacheLife, cacheTag } from "next/cache";
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
 * Uses Jaccard similarity on tags to find related posts. The computation is
 * cached via Next.js Cache Components (`cacheLife("max")`, keyed by
 * `related:${slug}`) so the related-posts Suspense boundary is part of the
 * prefetchable payload instead of a per-request dynamic hole. Invalidate with
 * `revalidateTag(\`related:${slug}\`)` when a post's tags change.
 *
 * @param slug - Post slug to find related posts for
 * @param limit - Maximum number of related posts to return
 * @returns Array of related posts sorted by similarity score
 */
export async function getRelatedPosts(
  slug: string,
  limit: number = CacheConfig.RELATED_POSTS.LIMIT,
): Promise<RelatedPost[]> {
  const results = await computeRelatedPosts(slug);
  return results.slice(0, limit);
}

async function computeRelatedPosts(slug: string): Promise<RelatedPost[]> {
  "use cache";
  cacheLife("max");
  cacheTag(`related:${slug}`);

  // Fetch current post tags
  const currentPost = await getPostBySlug(slug);

  if (!currentPost?.tags.length) return [];

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

  // Sort by similarity (highest first)
  return withSimilarity.sort((a, b) => b.similarity - a.similarity);
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
