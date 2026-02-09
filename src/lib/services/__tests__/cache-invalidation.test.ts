import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import * as postsQueries from "@/lib/queries/posts";
import type { SelectPost } from "@/schema";

// Mock dependencies
vi.mock("@/config/redis", () => ({
  default: {
    del: vi.fn(),
    zrem: vi.fn(),
  },
}));

vi.mock("@/lib/queries/posts", () => ({
  getPostsWithOverlappingTags: vi.fn(),
}));

vi.mock("../popular-posts", () => ({
  removeFromPopular: vi.fn(),
}));

// Import after mocks
import redis from "@/config/redis";
import {
  invalidatePopularPost,
  invalidatePost,
  invalidateRelatedByTags,
} from "../cache-invalidation";
import { removeFromPopular } from "../popular-posts";

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

describe("cache-invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("invalidatePost", () => {
    it("should delete both stats and related cache for a post", async () => {
      vi.mocked(redis.del).mockResolvedValue(2);

      await invalidatePost("test-post");

      expect(redis.del).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
      );
    });
  });

  describe("invalidateRelatedByTags", () => {
    it("should invalidate related caches for all posts with overlapping tags", async () => {
      const mockPosts = [
        createMockPost({ slug: "post-1", tags: ["typescript", "react"] }),
        createMockPost({ slug: "post-2", tags: ["typescript"] }),
        createMockPost({ slug: "post-3", tags: ["react", "testing"] }),
      ];

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue(
        mockPosts,
      );
      vi.mocked(redis.del).mockResolvedValue(3);

      await invalidateRelatedByTags(["typescript", "react"]);

      expect(postsQueries.getPostsWithOverlappingTags).toHaveBeenCalledWith(
        ["typescript", "react"],
        "",
      );

      expect(redis.del).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.RELATED_CACHE("post-1"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("post-2"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("post-3"),
      );
    });

    it("should exclude specified slug from invalidation", async () => {
      const mockPosts = [
        createMockPost({ slug: "post-1", tags: ["typescript"] }),
        createMockPost({ slug: "post-2", tags: ["typescript"] }),
      ];

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue(
        mockPosts,
      );

      await invalidateRelatedByTags(["typescript"], "excluded-post");

      expect(postsQueries.getPostsWithOverlappingTags).toHaveBeenCalledWith(
        ["typescript"],
        "excluded-post",
      );
    });

    it("should do nothing when no tags provided", async () => {
      await invalidateRelatedByTags([]);

      expect(postsQueries.getPostsWithOverlappingTags).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it("should handle empty result from database", async () => {
      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([]);

      await invalidateRelatedByTags(["typescript"]);

      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe("invalidatePopularPost", () => {
    it("should remove from popular and invalidate post caches", async () => {
      vi.mocked(removeFromPopular).mockResolvedValue(undefined);
      vi.mocked(redis.del).mockResolvedValue(2);

      await invalidatePopularPost("test-post");

      expect(removeFromPopular).toHaveBeenCalledWith("test-post");

      expect(redis.del).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
      );
    });

    it("should run operations in parallel", async () => {
      const removePromise = Promise.resolve();
      const delPromise = Promise.resolve(2);

      vi.mocked(removeFromPopular).mockReturnValue(removePromise);
      vi.mocked(redis.del).mockReturnValue(delPromise);

      await invalidatePopularPost("test-post");

      expect(removeFromPopular).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });
  });
});
