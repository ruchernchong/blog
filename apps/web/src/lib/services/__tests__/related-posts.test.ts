import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import * as postsQueries from "@/lib/queries/posts";

// Mock dependencies
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/config/redis", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("@/lib/queries/posts", () => ({
  getPostBySlug: vi.fn(),
  getPostsWithOverlappingTags: vi.fn(),
}));

// Import after mocks
import redis from "@/config/redis";
import { getRelatedPosts } from "../related-posts";

describe("related-posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRelatedPosts", () => {
    it("should return cached related posts if available", async () => {
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

      vi.mocked(redis.get).mockResolvedValue(cachedPosts);

      const result = await getRelatedPosts("test-post", 4);

      expect(result).toEqual(cachedPosts);
      expect(redis.get).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
      );
      expect(postsQueries.getPostBySlug).not.toHaveBeenCalled();
    });

    it("should calculate Jaccard similarity and cache result", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(redis.set).mockResolvedValue(undefined as any);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["typescript", "react", "testing"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "post-1",
          title: "Post 1",
          summary: "Summary 1",
          publishedAt: new Date("2024-01-01"),
          tags: ["typescript", "react"],
        },
        {
          slug: "post-2",
          title: "Post 2",
          summary: "Summary 2",
          publishedAt: new Date("2024-01-02"),
          tags: ["typescript"],
        },
        {
          slug: "post-3",
          title: "Post 3",
          summary: "Summary 3",
          publishedAt: new Date("2024-01-03"),
          tags: ["typescript", "react", "testing"],
        },
      ] as any);

      const result = await getRelatedPosts("test-post", 4);

      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe("post-3");
      expect(result[0].similarity).toBe(1.0);
      expect(result[1].slug).toBe("post-1");
      expect(result[1].similarity).toBeCloseTo(0.67, 1);
      expect(result[2].slug).toBe("post-2");
      expect(result[2].similarity).toBeCloseTo(0.33, 1);

      expect(redis.set).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
        result,
        { ex: CacheConfig.RELATED_POSTS.TTL },
      );
    });

    it("should respect limit parameter", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

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

      const result = await getRelatedPosts("test-post", 2);

      expect(result).toHaveLength(2);
    });

    it("should filter out posts below minimum similarity threshold", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["tag1", "tag2", "tag3", "tag4"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "high-similarity",
          title: "High",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1", "tag2", "tag3"],
        },
        {
          slug: "low-similarity",
          title: "Low",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1", "tag5", "tag6", "tag7", "tag8"],
        },
      ] as any);

      const result = await getRelatedPosts("test-post", 10);

      expect(result.length).toBeGreaterThan(0);
      for (const post of result) {
        expect(post.similarity).toBeGreaterThanOrEqual(
          CacheConfig.RELATED_POSTS.MIN_SIMILARITY,
        );
      }
    });

    it("should return empty array when current post has no tags", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: [],
      } as any);

      const result = await getRelatedPosts("test-post");

      expect(result).toEqual([]);
      expect(postsQueries.getPostsWithOverlappingTags).not.toHaveBeenCalled();
    });

    it("should return empty array when current post is not found", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue(
        undefined as unknown as { tags: string[] },
      );

      const result = await getRelatedPosts("test-post");

      expect(result).toEqual([]);
    });

    it("should calculate common tag count correctly", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["a", "b", "c"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "post-1",
          title: "Post 1",
          summary: null,
          publishedAt: new Date(),
          tags: ["a", "b"],
        },
      ] as any);

      const result = await getRelatedPosts("test-post");

      expect(result[0].commonTagCount).toBe(2);
    });

    it("should use default limit from config", async () => {
      const cachedPosts = Array.from({ length: 10 }, (_, i) => ({
        slug: `post-${i}`,
        title: `Post ${i}`,
        summary: null,
        publishedAt: new Date(),
        commonTagCount: 1,
        similarity: 0.5,
      }));

      vi.mocked(redis.get).mockResolvedValue(cachedPosts);

      const result = await getRelatedPosts("test-post");

      expect(result.length).toBeLessThanOrEqual(
        CacheConfig.RELATED_POSTS.LIMIT,
      );
    });
  });

  describe("Jaccard similarity algorithm", () => {
    it("should calculate perfect similarity for identical tag sets", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

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

      const result = await getRelatedPosts("test-post");

      expect(result[0].similarity).toBe(1.0);
    });

    it("should calculate zero similarity for completely different tags", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

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

      const result = await getRelatedPosts("test-post");

      expect(result).toHaveLength(0);
    });

    it("should calculate partial similarity correctly", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["a", "b", "c"],
      } as any);

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        {
          slug: "partial",
          title: "Partial",
          summary: null,
          publishedAt: new Date(),
          tags: ["b", "c", "d"],
        },
      ] as any);

      const result = await getRelatedPosts("test-post");

      expect(result[0].similarity).toBe(0.5);
    });
  });
});
