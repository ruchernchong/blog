import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import * as postsQueries from "@/lib/queries/posts";
import type { CacheService } from "../cache.service";
import { CacheInvalidationService } from "../cache-invalidation.service";
import type { PopularPostsService } from "../popular-posts.service";

vi.mock("@/lib/queries/posts", () => ({
  getPostsWithOverlappingTags: vi.fn(),
}));

describe("CacheInvalidationService", () => {
  let mockCache: {
    del: Mock;
  };
  let mockPopularService: {
    removeFromPopular: Mock;
  };
  let cacheInvalidationService: CacheInvalidationService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCache = {
      del: vi.fn(),
    };

    mockPopularService = {
      removeFromPopular: vi.fn(),
    };

    cacheInvalidationService = new CacheInvalidationService(
      mockCache as unknown as CacheService,
      mockPopularService as unknown as PopularPostsService,
    );
  });

  describe("invalidatePost", () => {
    it("deletes both stats and related cache for a post", async () => {
      mockCache.del.mockResolvedValue(undefined);

      await cacheInvalidationService.invalidatePost("test-post");

      expect(mockCache.del).toHaveBeenCalledWith([
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
      ]);
    });
  });

  describe("invalidateRelatedByTags", () => {
    it("invalidates related caches for all posts with overlapping tags", async () => {
      const mockPosts = [
        { slug: "post-1", tags: ["typescript", "react"] },
        { slug: "post-2", tags: ["typescript"] },
        { slug: "post-3", tags: ["react", "testing"] },
      ];

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue(
        mockPosts as any,
      );
      mockCache.del.mockResolvedValue(undefined);

      await cacheInvalidationService.invalidateRelatedByTags([
        "typescript",
        "react",
      ]);

      expect(postsQueries.getPostsWithOverlappingTags).toHaveBeenCalledWith(
        ["typescript", "react"],
        "",
      );

      expect(mockCache.del).toHaveBeenCalledWith([
        CacheConfig.REDIS_KEYS.RELATED_CACHE("post-1"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("post-2"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("post-3"),
      ]);
    });

    it("excludes specified slug from invalidation", async () => {
      const mockPosts = [
        { slug: "post-1", tags: ["typescript"] },
        { slug: "post-2", tags: ["typescript"] },
      ];

      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue(
        mockPosts as any,
      );

      await cacheInvalidationService.invalidateRelatedByTags(
        ["typescript"],
        "excluded-post",
      );

      expect(postsQueries.getPostsWithOverlappingTags).toHaveBeenCalledWith(
        ["typescript"],
        "excluded-post",
      );
    });

    it("does nothing when no tags provided", async () => {
      await cacheInvalidationService.invalidateRelatedByTags([]);

      expect(postsQueries.getPostsWithOverlappingTags).not.toHaveBeenCalled();
      expect(mockCache.del).not.toHaveBeenCalled();
    });

    it("handles empty result from database", async () => {
      vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue([]);

      await cacheInvalidationService.invalidateRelatedByTags(["typescript"]);

      expect(mockCache.del).not.toHaveBeenCalled();
    });
  });

  describe("invalidatePopularPost", () => {
    it("removes from popular and invalidates post caches", async () => {
      mockPopularService.removeFromPopular.mockResolvedValue(undefined);
      mockCache.del.mockResolvedValue(undefined);

      await cacheInvalidationService.invalidatePopularPost("test-post");

      expect(mockPopularService.removeFromPopular).toHaveBeenCalledWith(
        "test-post",
      );

      expect(mockCache.del).toHaveBeenCalledWith([
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        CacheConfig.REDIS_KEYS.RELATED_CACHE("test-post"),
      ]);
    });

    it("operations run in parallel", async () => {
      const removePromise = Promise.resolve();
      const delPromise = Promise.resolve();

      mockPopularService.removeFromPopular.mockReturnValue(removePromise);
      mockCache.del.mockReturnValue(delPromise);

      await cacheInvalidationService.invalidatePopularPost("test-post");

      // Both should be called (parallel execution)
      expect(mockPopularService.removeFromPopular).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe("invalidateAll", () => {
    it("logs warning when called", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();

      await cacheInvalidationService.invalidateAll();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("invalidateAll() called"),
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
