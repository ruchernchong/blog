import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { CacheConfig } from "@/lib/config/cache.config";
import * as postsQueries from "@/lib/queries/posts";
import type { CacheService } from "../cache.service";
import { PopularPostsService } from "../popular-posts.service";

// Mock dependencies
vi.mock("react", () => ({
  cache: (fn: any) => fn,
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

describe("PopularPostsService", () => {
  let mockCache: {
    zrange: Mock;
    zadd: Mock;
    zrem: Mock;
  };
  let popularPostsService: PopularPostsService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCache = {
      zrange: vi.fn(),
      zadd: vi.fn(),
      zrem: vi.fn(),
    };

    popularPostsService = new PopularPostsService(
      mockCache as unknown as CacheService,
    );
  });

  describe("getPopularPosts", () => {
    it("returns popular posts with view counts from Redis", async () => {
      // Mock Redis sorted set response (alternating member/score)
      mockCache.zrange.mockResolvedValue([
        "post-1",
        100,
        "post-2",
        75,
        "post-3",
        50,
      ]);

      // Mock database response
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

      const result = await popularPostsService.getPopularPosts(3);

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

      expect(mockCache.zrange).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        0,
        2, // limit - 1
        { rev: true, withScores: true },
      );

      expect(postsQueries.getPublishedPostsBySlugs).toHaveBeenCalledWith([
        "post-1",
        "post-2",
        "post-3",
      ]);
    });

    it("sorts posts by view count descending", async () => {
      mockCache.zrange.mockResolvedValue(["post-b", 50, "post-a", 100]);

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

      const result = await popularPostsService.getPopularPosts(2);

      expect(result[0].slug).toBe("post-a");
      expect(result[0].views).toBe(100);
      expect(result[1].slug).toBe("post-b");
      expect(result[1].views).toBe(50);
    });

    it("uses default limit when not specified", async () => {
      mockCache.zrange.mockResolvedValue([]);

      await popularPostsService.getPopularPosts();

      expect(mockCache.zrange).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        0,
        CacheConfig.POPULAR_POSTS.LIMIT - 1,
        expect.any(Object),
      );
    });

    it("handles empty Redis result", async () => {
      mockCache.zrange.mockResolvedValue([]);

      const result = await popularPostsService.getPopularPosts(5);

      // Should return fallback posts (we can't test the actual fallback
      // without mocking the entire database, but we verify it doesn't crash)
      expect(Array.isArray(result)).toBe(true);
    });

    it("handles Redis returning null", async () => {
      mockCache.zrange.mockResolvedValue(null);

      const result = await popularPostsService.getPopularPosts(5);

      expect(Array.isArray(result)).toBe(true);
    });

    it("handles missing posts in database", async () => {
      mockCache.zrange.mockResolvedValue(["post-1", 100, "post-2", 75]);

      // Only return one post from DB (post-2 is missing)
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

      const result = await popularPostsService.getPopularPosts(2);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("post-1");
    });
  });

  describe("updatePopularScore", () => {
    it("updates score in Redis sorted set", async () => {
      mockCache.zadd.mockResolvedValue(undefined);

      await popularPostsService.updatePopularScore("test-post", 150);

      expect(mockCache.zadd).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        150,
        "test-post",
      );
    });
  });

  describe("removeFromPopular", () => {
    it("removes post from Redis sorted set", async () => {
      mockCache.zrem.mockResolvedValue(undefined);

      await popularPostsService.removeFromPopular("test-post");

      expect(mockCache.zrem).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        "test-post",
      );
    });
  });
});
