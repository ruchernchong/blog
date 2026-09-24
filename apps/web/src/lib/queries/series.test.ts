import { beforeEach, describe, expect, it, vi } from "vitest";

// Queue of rows each awaited query resolves to, in call order
const { results, findFirst } = vi.hoisted(() => ({
  results: [] as unknown[][],
  findFirst: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/schema", async () => {
  const actual = await vi.importActual<typeof import("@/schema")>("@/schema");
  const query = {
    from: () => query,
    where: () => query,
    leftJoin: () => query,
    groupBy: () => query,
    // Every series query ends with orderBy, so it resolves the rows
    orderBy: () => Promise.resolve(results.shift() ?? []),
  };
  const db = {
    select: () => query,
    query: { series: { findFirst } },
  };
  return { ...actual, db };
});

import {
  getAllSeries,
  getPostsInSeries,
  getPublishedPostsInSeries,
  getPublishedSeries,
  getPublishedSeriesWithPostCount,
  getPublishedSeriesWithPosts,
  getSeriesById,
  getSeriesBySlug,
  getSeriesForSelector,
} from "./series";

describe("series queries", () => {
  beforeEach(() => {
    results.length = 0;
    findFirst.mockReset();
  });

  it("should find a series by id", async () => {
    findFirst.mockResolvedValue({ id: "s1" });

    await expect(getSeriesById("s1")).resolves.toEqual({ id: "s1" });
  });

  it("should find a series by slug", async () => {
    findFirst.mockResolvedValue(undefined);

    await expect(getSeriesBySlug("missing")).resolves.toBeUndefined();
  });

  it("should return the rows for each list query", async () => {
    results.push(
      [{ id: "published" }],
      [{ id: "all" }],
      [{ slug: "in-series" }],
      [{ slug: "published-in-series" }],
      [{ id: "with-count", postCount: 3 }],
      [{ id: "selector" }],
    );

    await expect(getPublishedSeries()).resolves.toEqual([{ id: "published" }]);
    await expect(getAllSeries()).resolves.toEqual([{ id: "all" }]);
    await expect(getPostsInSeries("s1")).resolves.toEqual([
      { slug: "in-series" },
    ]);
    await expect(getPublishedPostsInSeries("s1")).resolves.toEqual([
      { slug: "published-in-series" },
    ]);
    await expect(getPublishedSeriesWithPostCount()).resolves.toEqual([
      { id: "with-count", postCount: 3 },
    ]);
    await expect(getSeriesForSelector()).resolves.toEqual([{ id: "selector" }]);
  });

  it("should attach each series' published posts as slug and title", async () => {
    results.push(
      [{ id: "s1", postCount: 1 }],
      [{ slug: "post-a", title: "Post A", content: "ignored" }],
    );

    await expect(getPublishedSeriesWithPosts()).resolves.toEqual([
      { id: "s1", postCount: 1, posts: [{ slug: "post-a", title: "Post A" }] },
    ]);
  });
});
