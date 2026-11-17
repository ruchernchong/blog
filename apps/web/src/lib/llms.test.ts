import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

vi.mock("@/config", () => ({
  BASE_URL: "https://ruchern.dev",
  SITE_DESCRIPTION: "Frontend Developer from Singapore.",
  SITE_NAME: "Ru Chern",
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  isNull: vi.fn(),
}));

vi.mock("@/schema", () => {
  const rows = [
    {
      title: "Per-project shell environments with direnv",
      summary: "Loading the right environment variables.",
      metadata: { canonical: "/blog/direnv" },
    },
  ];
  const query = {
    from: () => query,
    where: () => query,
    orderBy: () => query,
    limit: async () => rows,
  };
  return { db: { select: () => query }, posts: {} };
});

import { getLlmsContent } from "./llms";

describe("getLlmsContent", () => {
  it("should open with the site name as the heading and a summary", async () => {
    const content = await getLlmsContent();

    expect(content.startsWith("# Ru Chern's Portfolio\n\n> Frontend")).toBe(
      true,
    );
  });

  it("should tell agents when to use the site and how to call it", async () => {
    const content = await getLlmsContent();

    expect(content).toContain("## When to use this site");
    expect(content).toContain("## How to call it");
    expect(content).toContain("`Accept: text/markdown`");
    expect(content).toContain("https://ruchern.dev/openapi.json");
    expect(content).toContain("https://docs.ruchern.dev");
  });

  it("should link recent posts with absolute URLs", async () => {
    const content = await getLlmsContent();

    expect(content).toContain(
      "- [Per-project shell environments with direnv](https://ruchern.dev/blog/direnv)\n  Loading the right environment variables.",
    );
  });
});
