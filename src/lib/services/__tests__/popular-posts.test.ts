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
    zrange: vi.fn(),
    zadd: vi.fn(),
    zrem: vi.fn(),
  },
}));

vi.mock("@/lib/queries/posts", () => ({
  getPublishedPostsBySlugs: vi.fn(),
}));

vi.mock("@/schema", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
  posts: {
    id: "id",
    slug: "slug",
    title: "title",
    summary: "summary",
    publishedAt: "publishedAt",
    metadata: "metadata",
    deletedAt: "deletedAt",
  },
}));

// Import after mocks
import redis from "@/config/redis";
import {
  getPopularPosts,
  removeFromPopular,
  updatePopularScore,
} from "../popular-posts";

describe("popular-posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPopularPosts", () => {
    it("should return popular posts with view counts from Redis", async () => {
      vi.mocked(redis.zrange).mockResolvedValue([
        "post-1",
        100,
        "post-2",
        75,
        "post-3",
        50,
      ]);

      const mockDbPosts = [
        {
          id: "1",
          slug: "post-1",
          title: "Post 1",
          summary: "Summary 1",
          publishedAt: new Date("2024-01-01"),
          metadata: { readingTime: "5 min" },
        },
        {
          id: "2",
          slug: "post-2",
          title: "Post 2",
          summary: "Summary 2",
          publishedAt: new Date("2024-01-02"),
          metadata: { readingTime: "3 min" },
        },
        {
          id: "3",
          slug: "post-3",
          title: "Post 3",
          summary: "Summary 3",
          publishedAt: new Date("2024-01-03"),
          metadata: { readingTime: "7 min" },
        },
      ];

      vi.mocked(postsQueries.getPublishedPostsBySlugs).mockResolvedValue(
        mockDbPosts as any,
      );

      const result = await getPopularPosts(3);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        slug: "post-1",
        views: 100,
      });
      expect(result[1]).toMatchObject({
        slug: "post-2",
        views: 75,
      });
      expect(result[2]).toMatchObject({
        slug: "post-3",
        views: 50,
      });

      expect(redis.zrange).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        0,
        2,
        { rev: true, withScores: true },
      );

      expect(postsQueries.getPublishedPostsBySlugs).toHaveBeenCalledWith([
        "post-1",
        "post-2",
        "post-3",
      ]);
    });

    it("should sort posts by view count descending", async () => {
      vi.mocked(redis.zrange).mockResolvedValue(["post-b", 50, "post-a", 100]);

      const mockDbPosts = [
        {
          id: "2",
          slug: "post-b",
          title: "Post B",
          summary: null,
          publishedAt: new Date(),
          metadata: {},
        },
        {
          id: "1",
          slug: "post-a",
          title: "Post A",
          summary: null,
          publishedAt: new Date(),
          metadata: {},
        },
      ];

      vi.mocked(postsQueries.getPublishedPostsBySlugs).mockResolvedValue(
        mockDbPosts as any,
      );

      const result = await getPopularPosts(2);

      expect(result[0].slug).toBe("post-a");
      expect(result[0].views).toBe(100);
      expect(result[1].slug).toBe("post-b");
      expect(result[1].views).toBe(50);
    });

    it("should use default limit when not specified", async () => {
      vi.mocked(redis.zrange).mockResolvedValue([]);

      await getPopularPosts();

      expect(redis.zrange).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        0,
        CacheConfig.POPULAR_POSTS.LIMIT - 1,
        expect.any(Object),
      );
    });

    it("should handle empty Redis result", async () => {
      vi.mocked(redis.zrange).mockResolvedValue([]);

      const result = await getPopularPosts(5);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle Redis returning null", async () => {
      vi.mocked(redis.zrange).mockResolvedValue(null as any);

      const result = await getPopularPosts(5);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle missing posts in database", async () => {
      vi.mocked(redis.zrange).mockResolvedValue(["post-1", 100, "post-2", 75]);

      vi.mocked(postsQueries.getPublishedPostsBySlugs).mockResolvedValue([
        {
          id: "1",
          slug: "post-1",
          title: "Post 1",
          summary: null,
          publishedAt: new Date(),
          metadata: {},
        },
      ] as any);

      const result = await getPopularPosts(2);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("post-1");
    });
  });

  describe("updatePopularScore", () => {
    it("should update score in Redis sorted set", async () => {
      vi.mocked(redis.zadd).mockResolvedValue(undefined as any);

      await updatePopularScore("test-post", 150);

      expect(redis.zadd).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        {
          score: 150,
          member: "test-post",
        },
      );
    });
  });

  describe("removeFromPopular", () => {
    it("should remove post from Redis sorted set", async () => {
      vi.mocked(redis.zrem).mockResolvedValue(undefined as any);

      await removeFromPopular("test-post");

      expect(redis.zrem).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        "test-post",
      );
    });
  });
});
