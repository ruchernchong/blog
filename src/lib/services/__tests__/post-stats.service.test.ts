import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import type { PostStats } from "@/types";
import type { CacheService } from "../cache.service";
import { PostStatsService } from "../post-stats.service";

// Mock React's cache function
vi.mock("react", () => ({
  cache: (fn: any) => fn,
}));

describe("PostStatsService", () => {
  let mockCache: {
    get: Mock;
    set: Mock;
    zadd: Mock;
  };
  let postStatsService: PostStatsService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      zadd: vi.fn(),
    };

    postStatsService = new PostStatsService(
      mockCache as unknown as CacheService,
    );
  });

  describe("getStats", () => {
    it("returns existing stats from cache", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: { user1: 2 },
        views: 10,
      };

      mockCache.get.mockResolvedValue(existingStats);

      const result = await postStatsService.getStats("test-post");

      expect(result).toEqual(existingStats);
      expect(mockCache.get).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
      );
    });

    it("initializes default stats when cache is empty", async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);

      const result = await postStatsService.getStats("new-post");

      expect(result).toEqual({
        slug: "new-post",
        likesByUser: {},
        views: 0,
      });

      expect(mockCache.set).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("new-post"),
        {
          slug: "new-post",
          likesByUser: {},
          views: 0,
        },
      );
    });
  });

  describe("incrementViews", () => {
    it("increments view count and updates cache and sorted set", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: {},
        views: 5,
      };

      mockCache.get.mockResolvedValue(existingStats);
      mockCache.set.mockResolvedValue(undefined);
      mockCache.zadd.mockResolvedValue(undefined);

      const result = await postStatsService.incrementViews("test-post");

      expect(result.views).toBe(6);
      expect(mockCache.set).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        { slug: "test-post", likesByUser: {}, views: 6 },
      );
      expect(mockCache.zadd).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        6,
        "test-post",
      );
    });

    it("handles first view correctly", async () => {
      mockCache.get.mockResolvedValue({
        slug: "test-post",
        likesByUser: {},
        views: 0,
      });

      const result = await postStatsService.incrementViews("test-post");

      expect(result.views).toBe(1);
    });
  });

  describe("incrementLikes", () => {
    it("increments likes for new user", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: {},
        views: 10,
      };

      mockCache.get.mockResolvedValue(existingStats);
      mockCache.set.mockResolvedValue(undefined);

      const result = await postStatsService.incrementLikes(
        "test-post",
        "user-hash-1",
      );

      expect(result).toEqual({
        totalLikes: 1,
        likesByUser: 1,
      });

      expect(mockCache.set).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        {
          slug: "test-post",
          likesByUser: { "user-hash-1": 1 },
          views: 10,
        },
      );
    });

    it("increments likes for existing user", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: { "user-hash-1": 2, "user-hash-2": 1 },
        views: 10,
      };

      mockCache.get.mockResolvedValue(existingStats);
      mockCache.set.mockResolvedValue(undefined);

      const result = await postStatsService.incrementLikes(
        "test-post",
        "user-hash-1",
      );

      expect(result).toEqual({
        totalLikes: 4, // 3 + 1
        likesByUser: 3,
      });
    });

    it("calculates total likes correctly across multiple users", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: { user1: 2, user2: 3, user3: 1 },
        views: 10,
      };

      mockCache.get.mockResolvedValue(existingStats);
      mockCache.set.mockResolvedValue(undefined);

      const result = await postStatsService.incrementLikes(
        "test-post",
        "user4",
      );

      expect(result.totalLikes).toBe(7); // 2 + 3 + 1 + 1
      expect(result.likesByUser).toBe(1);
    });
  });

  describe("getLikesByUser", () => {
    it("returns likes for existing user", async () => {
      const stats: PostStats = {
        slug: "test-post",
        likesByUser: { "user-hash": 5 },
        views: 10,
      };

      mockCache.get.mockResolvedValue(stats);

      const result = await postStatsService.getLikesByUser(
        "test-post",
        "user-hash",
      );

      expect(result).toBe(5);
    });

    it("returns 0 for non-existent user", async () => {
      const stats: PostStats = {
        slug: "test-post",
        likesByUser: {},
        views: 10,
      };

      mockCache.get.mockResolvedValue(stats);

      const result = await postStatsService.getLikesByUser(
        "test-post",
        "unknown-user",
      );

      expect(result).toBe(0);
    });

    it("returns 0 when userHash is undefined", async () => {
      const result = await postStatsService.getLikesByUser(
        "test-post",
        undefined,
      );

      expect(result).toBe(0);
      expect(mockCache.get).not.toHaveBeenCalled();
    });
  });

  describe("getTotalLikes", () => {
    it("returns total likes across all users", async () => {
      const stats: PostStats = {
        slug: "test-post",
        likesByUser: { user1: 2, user2: 3, user3: 5 },
        views: 10,
      };

      mockCache.get.mockResolvedValue(stats);

      const result = await postStatsService.getTotalLikes("test-post");

      expect(result).toBe(10); // 2 + 3 + 5
    });

    it("returns 0 when no likes exist", async () => {
      const stats: PostStats = {
        slug: "test-post",
        likesByUser: {},
        views: 10,
      };

      mockCache.get.mockResolvedValue(stats);

      const result = await postStatsService.getTotalLikes("test-post");

      expect(result).toBe(0);
    });
  });
});
