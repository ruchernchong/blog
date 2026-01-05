import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import type { PostStats } from "@/types";

// Mock dependencies
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/config/redis", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    zadd: vi.fn(),
  },
}));

// Import after mocks
import redis from "@/config/redis";
import {
  getLikesByUser,
  getPostStats,
  getTotalLikes,
  incrementLikes,
  incrementViews,
} from "../post-stats";

describe("post-stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPostStats", () => {
    it("should return existing stats from cache", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: { user1: 2 },
        views: 10,
      };

      vi.mocked(redis.get).mockResolvedValue(existingStats);

      const result = await getPostStats("test-post");

      expect(result).toEqual(existingStats);
      expect(redis.get).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
      );
    });

    it("should initialise default stats when cache is empty", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(redis.set).mockResolvedValue(undefined as any);

      const result = await getPostStats("new-post");

      expect(result).toEqual({
        slug: "new-post",
        likesByUser: {},
        views: 0,
      });

      expect(redis.set).toHaveBeenCalledWith(
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
    it("should increment view count and update cache and sorted set", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: {},
        views: 5,
      };

      vi.mocked(redis.get).mockResolvedValue(existingStats);
      vi.mocked(redis.set).mockResolvedValue(undefined as any);
      vi.mocked(redis.zadd).mockResolvedValue(undefined as any);

      const result = await incrementViews("test-post");

      expect(result.views).toBe(6);
      expect(redis.set).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        { slug: "test-post", likesByUser: {}, views: 6 },
      );
      expect(redis.zadd).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        {
          score: 6,
          member: "test-post",
        },
      );
    });

    it("should handle first view correctly", async () => {
      vi.mocked(redis.get).mockResolvedValue({
        slug: "test-post",
        likesByUser: {},
        views: 0,
      });

      const result = await incrementViews("test-post");

      expect(result.views).toBe(1);
    });
  });

  describe("incrementLikes", () => {
    it("should increment likes for new user", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: {},
        views: 10,
      };

      vi.mocked(redis.get).mockResolvedValue(existingStats);
      vi.mocked(redis.set).mockResolvedValue(undefined as any);

      const result = await incrementLikes("test-post", "user-hash-1");

      expect(result).toEqual({
        totalLikes: 1,
        likesByUser: 1,
      });

      expect(redis.set).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("test-post"),
        {
          slug: "test-post",
          likesByUser: { "user-hash-1": 1 },
          views: 10,
        },
      );
    });

    it("should increment likes for existing user", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: { "user-hash-1": 2, "user-hash-2": 1 },
        views: 10,
      };

      vi.mocked(redis.get).mockResolvedValue(existingStats);
      vi.mocked(redis.set).mockResolvedValue(undefined as any);

      const result = await incrementLikes("test-post", "user-hash-1");

      expect(result).toEqual({
        totalLikes: 4,
        likesByUser: 3,
      });
    });

    it("should calculate total likes correctly across multiple users", async () => {
      const existingStats: PostStats = {
        slug: "test-post",
        likesByUser: { user1: 2, user2: 3, user3: 1 },
        views: 10,
      };

      vi.mocked(redis.get).mockResolvedValue(existingStats);
      vi.mocked(redis.set).mockResolvedValue(undefined as any);

      const result = await incrementLikes("test-post", "user4");

      expect(result.totalLikes).toBe(7);
      expect(result.likesByUser).toBe(1);
    });
  });

  describe("getLikesByUser", () => {
    it("should return likes for existing user", async () => {
      const stats: PostStats = {
        slug: "test-post",
        likesByUser: { "user-hash": 5 },
        views: 10,
      };

      vi.mocked(redis.get).mockResolvedValue(stats);

      const result = await getLikesByUser("test-post", "user-hash");

      expect(result).toBe(5);
    });

    it("should return 0 for non-existent user", async () => {
      const stats: PostStats = {
        slug: "test-post",
        likesByUser: {},
        views: 10,
      };

      vi.mocked(redis.get).mockResolvedValue(stats);

      const result = await getLikesByUser("test-post", "unknown-user");

      expect(result).toBe(0);
    });

    it("should return 0 when userHash is undefined", async () => {
      const result = await getLikesByUser("test-post", undefined);

      expect(result).toBe(0);
      expect(redis.get).not.toHaveBeenCalled();
    });
  });

  describe("getTotalLikes", () => {
    it("should return total likes across all users", async () => {
      const stats: PostStats = {
        slug: "test-post",
        likesByUser: { user1: 2, user2: 3, user3: 5 },
        views: 10,
      };

      vi.mocked(redis.get).mockResolvedValue(stats);

      const result = await getTotalLikes("test-post");

      expect(result).toBe(10);
    });

    it("should return 0 when no likes exist", async () => {
      const stats: PostStats = {
        slug: "test-post",
        likesByUser: {},
        views: 10,
      };

      vi.mocked(redis.get).mockResolvedValue(stats);

      const result = await getTotalLikes("test-post");

      expect(result).toBe(0);
    });
  });
});
