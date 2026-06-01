import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { POST } from "../route";

describe("MCP revalidation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MCP_REVALIDATE_SECRET;
  });

  it("should reject requests when the route is not configured", async () => {
    const response = await POST(
      new Request("https://ruchern.dev/api/mcp/revalidate", {
        method: "POST",
        body: JSON.stringify({ tags: ["posts:list"] }),
      }),
    );

    expect(response.status).toBe(500);
  });

  it("should reject requests with an invalid secret", async () => {
    process.env.MCP_REVALIDATE_SECRET = "correct-secret";

    const response = await POST(
      new Request("https://ruchern.dev/api/mcp/revalidate", {
        method: "POST",
        headers: {
          "X-MCP-Revalidate-Secret": "wrong-secret",
        },
        body: JSON.stringify({ tags: ["posts:list"] }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("should revalidate requested tags", async () => {
    process.env.MCP_REVALIDATE_SECRET = "correct-secret";

    const response = await POST(
      new Request("https://ruchern.dev/api/mcp/revalidate", {
        method: "POST",
        headers: {
          "X-MCP-Revalidate-Secret": "correct-secret",
        },
        body: JSON.stringify({
          tags: ["posts:list", "post:hello-world", 123],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("posts:list", "max");
    expect(revalidateTag).toHaveBeenCalledWith("post:hello-world", "max");
    expect(revalidateTag).not.toHaveBeenCalledWith(123, "max");
  });
});
