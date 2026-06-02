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

interface PostFixture {
  slug?: string;
  title?: string;
  summary?: string | null;
  publishedAt?: Date;
  tags?: string[];
}

const createPostFixture = ({
  slug = "post-1",
  title = "Post 1",
  summary = null,
  publishedAt = new Date(),
  tags = [],
}: PostFixture = {}) => ({
  slug,
  title,
  summary,
  publishedAt,
  tags,
});

const mockCacheMiss = () => {
  vi.mocked(redis.get).mockResolvedValue(null);
};

const mockCurrentPostTags = (tags: string[]) => {
  vi.mocked(postsQueries.getPostBySlug).mockResolvedValue({
    tags,
  } as Awaited<ReturnType<typeof postsQueries.getPostBySlug>>);
};

const mockOverlappingPosts = (
  posts: ReturnType<typeof createPostFixture>[],
) => {
  vi.mocked(postsQueries.getPostsWithOverlappingTags).mockResolvedValue(
    posts as Awaited<
      ReturnType<typeof postsQueries.getPostsWithOverlappingTags>
    >,
  );
};

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
      mockCacheMiss();
      vi.mocked(redis.set).mockResolvedValue(undefined);

      mockCurrentPostTags(["typescript", "react", "testing"]);

      mockOverlappingPosts([
        createPostFixture({
          slug: "post-1",
          title: "Post 1",
          summary: "Summary 1",
          publishedAt: new Date("2024-01-01"),
          tags: ["typescript", "react"],
        }),
        createPostFixture({
          slug: "post-2",
          title: "Post 2",
          summary: "Summary 2",
          publishedAt: new Date("2024-01-02"),
          tags: ["typescript"],
        }),
        createPostFixture({
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
      mockCacheMiss();
      mockCurrentPostTags(["tag1", "tag2"]);
      mockOverlappingPosts([
        createPostFixture({ slug: "post-1", tags: ["tag1", "tag2"] }),
        createPostFixture({ slug: "post-2", title: "Post 2", tags: ["tag1"] }),
        createPostFixture({ slug: "post-3", title: "Post 3", tags: ["tag2"] }),
      ]);

      const result = await getRelatedPosts("test-post", 2);

      expect(result).toHaveLength(2);
    });

    it("should filter out posts below minimum similarity threshold", async () => {
      mockCacheMiss();
      mockCurrentPostTags(["tag1", "tag2", "tag3", "tag4"]);
      mockOverlappingPosts([
        createPostFixture({
          slug: "high-similarity",
          title: "High",
          tags: ["tag1", "tag2", "tag3"],
        }),
        createPostFixture({
          slug: "low-similarity",
          title: "Low",
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
      mockCacheMiss();
      mockCurrentPostTags([]);

      const result = await getRelatedPosts("test-post");

      expect(result).toEqual([]);
      expect(postsQueries.getPostsWithOverlappingTags).not.toHaveBeenCalled();
    });

    it("should return empty array when current post is not found", async () => {
      mockCacheMiss();
      vi.mocked(postsQueries.getPostBySlug).mockResolvedValue(
        undefined as unknown as { tags: string[] },
      );

      const result = await getRelatedPosts("test-post");

      expect(result).toEqual([]);
    });

    it("should calculate common tag count correctly", async () => {
      mockCacheMiss();
      mockCurrentPostTags(["a", "b", "c"]);
      mockOverlappingPosts([createPostFixture({ tags: ["a", "b"] })]);

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
      mockCacheMiss();
      mockCurrentPostTags(["a", "b", "c"]);
      mockOverlappingPosts([
        createPostFixture({
          slug: "identical",
          title: "Identical",
          tags: ["a", "b", "c"],
        }),
      ]);

      const result = await getRelatedPosts("test-post");

      expect(result[0].similarity).toBe(1.0);
    });

    it("should calculate zero similarity for completely different tags", async () => {
      mockCacheMiss();
      mockCurrentPostTags(["a", "b"]);
      mockOverlappingPosts([
        createPostFixture({
          slug: "different",
          title: "Different",
          tags: ["c", "d"],
        }),
      ]);

      const result = await getRelatedPosts("test-post");

      expect(result).toHaveLength(0);
    });

    it("should calculate partial similarity correctly", async () => {
      mockCacheMiss();
      mockCurrentPostTags(["a", "b", "c"]);
      mockOverlappingPosts([
        createPostFixture({
          slug: "partial",
          title: "Partial",
          tags: ["b", "c", "d"],
        }),
      ]);

      const result = await getRelatedPosts("test-post");

      expect(result[0].similarity).toBe(0.5);
    });
  });
});
