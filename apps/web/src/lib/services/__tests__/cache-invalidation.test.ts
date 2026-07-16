import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import * as postsQueries from "@/lib/queries/posts";

// Mock dependencies
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

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
import { revalidateTag } from "next/cache";
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
    it("should delete post stats from Redis", async () => {
      vi.mocked(redis.del).mockResolvedValue(undefined as any);

      await invalidatePost("test-post");

      expect(redis.del).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
      );
    });

    it("should revalidate post, mdx, related, list and count tags", async () => {
      vi.mocked(redis.del).mockResolvedValue(undefined as any);

      await invalidatePost("test-post");

      expect(revalidateTag).toHaveBeenCalledWith("post:test-post", "max");
      expect(revalidateTag).toHaveBeenCalledWith("mdx:test-post", "max");
      expect(revalidateTag).toHaveBeenCalledWith("related:test-post", "max");
      expect(revalidateTag).toHaveBeenCalledWith("posts:list", "max");
      expect(revalidateTag).toHaveBeenCalledWith("posts:count", "max");
    });
  });

  describe("invalidateRelatedByTags", () => {
    it("should revalidate related tags for all posts with overlapping tags", async () => {
      const mockPosts = [
        { slug: "post-1", tags: ["typescript", "react"] },
        { slug: "post-2", tags: ["typescript"] },
        { slug: "post-3", tags: ["react", "testing"] },
      ];

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue(
        mockPosts as any,
      );

      await invalidateRelatedByTags(["typescript", "react"]);

      expect(postsQueries.getPostsWithOverlappingTags).toHaveBeenCalledWith(
        ["typescript", "react"],
        "",
      );

      expect(revalidateTag).toHaveBeenCalledWith("related:post-1", "max");
      expect(revalidateTag).toHaveBeenCalledWith("related:post-2", "max");
      expect(revalidateTag).toHaveBeenCalledWith("related:post-3", "max");
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
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("should handle empty result from database", async () => {
      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([]);

      await invalidateRelatedByTags(["typescript"]);

      expect(revalidateTag).not.toHaveBeenCalled();
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
      );
      expect(revalidateTag).toHaveBeenCalledWith("related:test-post", "max");
    });

    it("should run operations in parallel", async () => {
      vi.mocked(removeFromPopular).mockResolvedValue(undefined);
      vi.mocked(redis.del).mockResolvedValue(undefined as any);

      await invalidatePopularPost("test-post");

      expect(removeFromPopular).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });
  });
});
