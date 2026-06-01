import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/cache-invalidation-data", () => ({
  invalidatePostData: vi.fn(),
  invalidatePopularPostData: vi.fn(),
  invalidateRelatedDataByTags: vi.fn(),
}));

import {
  invalidatePopularPostData,
  invalidatePostData,
  invalidateRelatedDataByTags,
} from "@/lib/services/cache-invalidation-data";
import { createWorkerPostToolServices } from "../worker-services";

describe("Worker post tool services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MCP_REVALIDATE_SECRET = "revalidate-secret";
    process.env.NEXT_PUBLIC_BASE_URL = "https://ruchern.dev";
    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
  });

  it("should invalidate post data and revalidate Next.js cache tags", async () => {
    const services = createWorkerPostToolServices();

    await services.invalidatePost("hello-world");

    expect(invalidatePostData).toHaveBeenCalledWith("hello-world");
    expect(fetch).toHaveBeenCalledWith(
      "https://ruchern.dev/api/mcp/revalidate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-MCP-Revalidate-Secret": "revalidate-secret",
        }),
        body: JSON.stringify({
          tags: ["post:hello-world", "posts:list", "posts:count"],
        }),
      }),
    );
  });

  it("should invalidate popular post data and revalidate matching tags", async () => {
    const services = createWorkerPostToolServices();

    await services.invalidatePopularPost("popular-post");

    expect(invalidatePopularPostData).toHaveBeenCalledWith("popular-post");
    expect(fetch).toHaveBeenCalledWith(
      "https://ruchern.dev/api/mcp/revalidate",
      expect.objectContaining({
        body: JSON.stringify({
          tags: ["post:popular-post", "posts:list", "posts:count"],
        }),
      }),
    );
  });

  it("should invalidate related data without calling the revalidation route", async () => {
    const services = createWorkerPostToolServices();

    await services.invalidateRelatedByTags(["react"], "current-post");

    expect(invalidateRelatedDataByTags).toHaveBeenCalledWith(
      ["react"],
      "current-post",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
