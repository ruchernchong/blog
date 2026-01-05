import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import * as postsQueries from "@/lib/queries/posts";

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

describe("cache-invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("invalidatePost", () => {
    it("should delete both stats and related cache for a post", async () => {
      vi.mocked(redis.del).mockResolvedValue(undefined as any);

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
        { slug: "post-1", tags: ["typescript", "react"] },
        { slug: "post-2", tags: ["typescript"] },
        { slug: "post-3", tags: ["react", "testing"] },
      ];

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue(
        mockPosts as any,
      );
      vi.mocked(redis.del).mockResolvedValue(undefined as any);

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
        { slug: "post-1", tags: ["typescript"] },
        { slug: "post-2", tags: ["typescript"] },
      ];

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue(
        mockPosts as any,
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
      vi.mocked(redis.del).mockResolvedValue(undefined as any);

      await invalidatePopularPost("test-post");

      expect(removeFromPopular).toHaveBeenCalledWith("test-post");

      expect(redis.del).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
      );
    });

    it("should run operations in parallel", async () => {
      const removePromise = Promise.resolve();
      const delPromise = Promise.resolve(undefined as any);

      vi.mocked(removeFromPopular).mockReturnValue(removePromise);
      vi.mocked(redis.del).mockReturnValue(delPromise);

      await invalidatePopularPost("test-post");

      expect(removeFromPopular).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });
  });
});
