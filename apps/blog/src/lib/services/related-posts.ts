import { cache } from "react";
import redis from "@/config/redis";
import {
  getPostBySlug,
  getPostsWithOverlappingTags,
} from "@/lib/queries/posts";

interface RelatedPost {
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: Date | null;
  commonTagCount: number;
  similarity: number;
}

const calculateJaccardSimilarity = (
  tags1: string[],
  tags2: string[],
): number => {
  const commonTags = tags1.filter((tag) => tags2.includes(tag));
  const unionSize = new Set([...tags1, ...tags2]).size;
  return commonTags.length / unionSize;
};

export const getRelatedPosts = cache(
  async (slug: string, limit: number = 4): Promise<RelatedPost[]> => {
    // Check Redis cache
    const cacheKey = `post:${slug}:related`;
    const cached = await redis.get<RelatedPost[]>(cacheKey);
    if (cached) return cached;

    // Fetch current post tags
    const currentPost = await getPostBySlug(slug);

    if (!currentPost || !currentPost.tags.length) return [];

    // Find posts with overlapping tags
    const relatedPosts = await getPostsWithOverlappingTags(
      currentPost.tags,
      slug,
    );

    // Calculate Jaccard similarity
    const withSimilarity = relatedPosts.map((post) => {
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
    });

    // Sort by similarity and limit
    const results = withSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Cache for 24 hours
    await redis.set(cacheKey, results, { ex: 86400 });

    return results;
  },
);
