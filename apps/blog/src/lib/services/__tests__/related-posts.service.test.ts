import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import * as postsQueries from "@/lib/queries/posts";
import type { CacheService } from "../cache.service";
import { RelatedPostsCalculator } from "../related-posts.service";

// Mock dependencies
vi.mock("react", () => ({
  cache: (fn: any) => fn,
}));

vi.mock("@/lib/queries/posts", () => ({
  getPostBySlug: vi.fn(),
  getPostsWithOverlappingTags: vi.fn(),
}));

describe("RelatedPostsCalculator", () => {
  let mockCache: {
    get: Mock;
    set: Mock;
  };
  let relatedPostsCalculator: RelatedPostsCalculator;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
    };

    relatedPostsCalculator = new RelatedPostsCalculator(
      mockCache as unknown as CacheService,
    );
  });

  describe("getRelatedPosts", () => {
    it("returns cached related posts if available", async () => {
      const cachedPosts = [
        {
          slug: "related-1",
          title: "Related 1",
          summary: "Summary",
          publishedAt: new Date(),
          commonTagCount: 2,
          similarity: 0.8,
        },
      ];

      mockCache.get.mockResolvedValue(cachedPosts);

      const result = await relatedPostsCalculator.getRelatedPosts(
        "test-post",
        4,
      );

      expect(result).toEqual(cachedPosts);
      expect(mockCache.get).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
      );
      expect(postsQueries.getPostBySlug).not.toHaveBeenCalled();
    });

    it("calculates Jaccard similarity and caches result", async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);

      // Mock current post
      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["typescript", "react", "testing"],
      } as any);

      // Mock related posts
      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "post-1",
          title: "Post 1",
          summary: "Summary 1",
          publishedAt: new Date("2024-01-01"),
          tags: ["typescript", "react"], // 2/3 common, union=3, similarity=0.67
        },
        {
          slug: "post-2",
          title: "Post 2",
          summary: "Summary 2",
          publishedAt: new Date("2024-01-02"),
          tags: ["typescript"], // 1/3 common, union=3, similarity=0.33
        },
        {
          slug: "post-3",
          title: "Post 3",
          summary: "Summary 3",
          publishedAt: new Date("2024-01-03"),
          tags: ["typescript", "react", "testing"], // 3/3 common, similarity=1.0
        },
      ] as any);

      const result = await relatedPostsCalculator.getRelatedPosts(
        "test-post",
        4,
      );

      // Should be sorted by similarity descending
      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe("post-3");
      expect(result[0].similarity).toBe(1.0);
      expect(result[1].slug).toBe("post-1");
      expect(result[1].similarity).toBeCloseTo(0.67, 1);
      expect(result[2].slug).toBe("post-2");
      expect(result[2].similarity).toBeCloseTo(0.33, 1);

      // Should cache the result
      expect(mockCache.set).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
        result,
        { ex: CacheConfig.RELATED_POSTS.TTL },
      );
    });

    it("respects limit parameter", async () => {
      mockCache.get.mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["tag1", "tag2"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "post-1",
          title: "Post 1",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1", "tag2"],
        },
        {
          slug: "post-2",
          title: "Post 2",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1"],
        },
        {
          slug: "post-3",
          title: "Post 3",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag2"],
        },
      ] as any);

      const result = await relatedPostsCalculator.getRelatedPosts(
        "test-post",
        2,
      );

      expect(result).toHaveLength(2);
    });

    it("filters out posts below minimum similarity threshold", async () => {
      mockCache.get.mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["tag1", "tag2", "tag3", "tag4"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "high-similarity",
          title: "High",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1", "tag2", "tag3"], // similarity = 0.6
        },
        {
          slug: "low-similarity",
          title: "Low",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1", "tag5", "tag6", "tag7", "tag8"], // similarity = 0.11
        },
      ] as any);

      const result = await relatedPostsCalculator.getRelatedPosts(
        "test-post",
        10,
      );

      // Low similarity post should be filtered out if below MIN_SIMILARITY (0.1)
      expect(result.length).toBeGreaterThan(0);
      result.forEach((post) => {
        expect(post.similarity).toBeGreaterThanOrEqual(
          CacheConfig.RELATED_POSTS.MIN_SIMILARITY,
        );
      });
    });

    it("returns empty array when current post has no tags", async () => {
      mockCache.get.mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: [],
      } as any);

      const result = await relatedPostsCalculator.getRelatedPosts("test-post");

      expect(result).toEqual([]);
      expect(postsQueries.getPostsWithOverlappingTags).not.toHaveBeenCalled();
    });

    it("returns empty array when current post is not found", async () => {
      mockCache.get.mockResolvedValue(null);
      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue(null);

      const result = await relatedPostsCalculator.getRelatedPosts("test-post");

      expect(result).toEqual([]);
    });

    it("calculates common tag count correctly", async () => {
      mockCache.get.mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["a", "b", "c"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "post-1",
          title: "Post 1",
          summary: null,
          publishedAt: new Date(),
          tags: ["a", "b"], // 2 common tags
        },
      ] as any);

      const result = await relatedPostsCalculator.getRelatedPosts("test-post");

      expect(result[0].commonTagCount).toBe(2);
    });

    it("uses default limit from config", async () => {
      const cachedPosts = Array.from({ length: 10 }, (_, i) => ({
        slug: `post-${i}`,
        title: `Post ${i}`,
        summary: null,
        publishedAt: new Date(),
        commonTagCount: 1,
        similarity: 0.5,
      }));

      mockCache.get.mockResolvedValue(cachedPosts);

      const result = await relatedPostsCalculator.getRelatedPosts("test-post");

      // Should slice to default limit
      expect(result.length).toBeLessThanOrEqual(
        CacheConfig.RELATED_POSTS.LIMIT,
      );
    });
  });

  describe("Jaccard similarity algorithm", () => {
    it("calculates perfect similarity for identical tag sets", async () => {
      mockCache.get.mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["a", "b", "c"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "identical",
          title: "Identical",
          summary: null,
          publishedAt: new Date(),
          tags: ["a", "b", "c"],
        },
      ] as any);

      const result = await relatedPostsCalculator.getRelatedPosts("test-post");

      expect(result[0].similarity).toBe(1.0);
    });

    it("calculates zero similarity for completely different tags", async () => {
      mockCache.get.mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["a", "b"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "different",
          title: "Different",
          summary: null,
          publishedAt: new Date(),
          tags: ["c", "d"],
        },
      ] as any);

      const result = await relatedPostsCalculator.getRelatedPosts("test-post");

      // Post with zero similarity is filtered out by MIN_SIMILARITY threshold
      expect(result).toHaveLength(0);
    });

    it("calculates partial similarity correctly", async () => {
      mockCache.get.mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["a", "b", "c"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "partial",
          title: "Partial",
          summary: null,
          publishedAt: new Date(),
          tags: ["b", "c", "d"], // 2 common (b, c), union = 4 (a,b,c,d), similarity = 0.5
        },
      ] as any);

      const result = await relatedPostsCalculator.getRelatedPosts("test-post");

      expect(result[0].similarity).toBe(0.5);
    });
  });
});
