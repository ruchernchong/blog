import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import * as postsQueries from "@/lib/queries/posts";
import type { SelectPost } from "@/schema";

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

const createMockPost = (overrides: Partial<SelectPost>): SelectPost => ({
  id: "post-id",
  slug: "post-slug",
  title: "Post title",
  summary: null,
  metadata: {
    readingTime: "1 min",
    description: "description",
    canonical: "https://example.com/post",
    openGraph: {
      title: "Post title",
      siteName: "Site",
      description: "description",
      type: "article",
      publishedTime: "2024-01-01T00:00:00.000Z",
      url: "https://example.com/post",
      locale: "en_SG",
    },
    twitter: {
      card: "summary_large_image",
      site: "@site",
      title: "Post title",
      description: "description",
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "Post title",
      dateModified: "2024-01-01T00:00:00.000Z",
      datePublished: "2024-01-01T00:00:00.000Z",
      description: "description",
      url: "https://example.com/post",
      author: {
        "@type": "Person",
        name: "Author",
        url: "https://example.com",
      },
    },
  },
  content: "content",
  status: "published",
  tags: [],
  featured: false,
  coverImage: null,
  authorId: null,
  seriesId: null,
  seriesOrder: null,
  publishedAt: new Date("2024-01-01T00:00:00.000Z"),
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
  ...overrides,
});

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
      vi.mocked(redis.set).mockResolvedValue("OK");

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["typescript", "react", "testing"],
      });

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        createMockPost({
          slug: "post-1",
          title: "Post 1",
          summary: "Summary 1",
          publishedAt: new Date("2024-01-01"),
          tags: ["typescript", "react"],
        }),
        createMockPost({
          slug: "post-2",
          title: "Post 2",
          summary: "Summary 2",
          publishedAt: new Date("2024-01-02"),
          tags: ["typescript"],
        }),
        createMockPost({
          slug: "post-3",
          title: "Post 3",
          summary: "Summary 3",
          publishedAt: new Date("2024-01-03"),
          tags: ["typescript", "react", "testing"],
        }),
      ]);

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
      });

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        createMockPost({
          slug: "post-1",
          title: "Post 1",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1", "tag2"],
        }),
        createMockPost({
          slug: "post-2",
          title: "Post 2",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1"],
        }),
        createMockPost({
          slug: "post-3",
          title: "Post 3",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag2"],
        }),
      ]);

      const result = await getRelatedPosts("test-post", 2);

      expect(result).toHaveLength(2);
    });

    it("should filter out posts below minimum similarity threshold", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["tag1", "tag2", "tag3", "tag4"],
      });

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        createMockPost({
          slug: "high-similarity",
          title: "High",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1", "tag2", "tag3"],
        }),
        createMockPost({
          slug: "low-similarity",
          title: "Low",
          summary: null,
          publishedAt: new Date(),
          tags: ["tag1", "tag5", "tag6", "tag7", "tag8"],
        }),
      ]);

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
      });

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
      });

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        createMockPost({
          slug: "post-1",
          title: "Post 1",
          summary: null,
          publishedAt: new Date(),
          tags: ["a", "b"],
        }),
      ]);

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
      });

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        createMockPost({
          slug: "identical",
          title: "Identical",
          summary: null,
          publishedAt: new Date(),
          tags: ["a", "b", "c"],
        }),
      ]);

      const result = await getRelatedPosts("test-post");

      expect(result[0].similarity).toBe(1.0);
    });

    it("should calculate zero similarity for completely different tags", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["a", "b"],
      });

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        createMockPost({
          slug: "different",
          title: "Different",
          summary: null,
          publishedAt: new Date(),
          tags: ["c", "d"],
        }),
      ]);

      const result = await getRelatedPosts("test-post");

      expect(result).toHaveLength(0);
    });

    it("should calculate partial similarity correctly", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
        tags: ["a", "b", "c"],
      });

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([
        createMockPost({
          slug: "partial",
          title: "Partial",
          summary: null,
          publishedAt: new Date(),
          tags: ["b", "c", "d"],
        }),
      ]);

      const result = await getRelatedPosts("test-post");

      expect(result[0].similarity).toBe(0.5);
    });
  });
});
