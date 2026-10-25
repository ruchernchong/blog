import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import { DELETE, GET, HEAD, PATCH, POST, PUT } from "./route";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogError = vi.mocked(logError);

const SECRET = "test-revalidate-secret";

function makeRequest(body: unknown, authorization?: string): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authorization) headers.Authorization = authorization;

  return new Request("https://ruchern.dev/api/revalidate", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("REVALIDATE_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("authentication", () => {
    it("should return 401 when the Authorization header is missing", async () => {
      const response = await POST(makeRequest({ tags: ["usage"] }));

      expect(response.status).toBe(401);
      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });

    it("should return 401 when the secret is wrong", async () => {
      const response = await POST(
        makeRequest({ tags: ["usage"] }, "Bearer wrong-secret"),
      );

      expect(response.status).toBe(401);
      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });

    it("should return 401 when the scheme is not Bearer", async () => {
      const response = await POST(makeRequest({ tags: ["usage"] }, SECRET));

      expect(response.status).toBe(401);
    });

    it("should accept the Bearer scheme in any case", async () => {
      const response = await POST(
        makeRequest({ tags: ["usage"] }, `bearer ${SECRET}`),
      );

      expect(response.status).toBe(200);
    });

    it("should return 401 and log when REVALIDATE_SECRET is unset", async () => {
      vi.stubEnv("REVALIDATE_SECRET", "");

      const response = await POST(makeRequest({ tags: ["usage"] }, "Bearer "));

      expect(response.status).toBe(401);
      expect(mockLogError).toHaveBeenCalledWith(
        ERROR_IDS.REVALIDATE_SECRET_MISSING,
        expect.any(String),
      );
      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should return 400 for invalid JSON", async () => {
      const response = await POST(makeRequest("{", `Bearer ${SECRET}`));

      expect(response.status).toBe(400);
    });

    it("should return 400 when tags is missing", async () => {
      const response = await POST(makeRequest({}, `Bearer ${SECRET}`));

      expect(response.status).toBe(400);
    });

    it("should return 400 when tags is empty", async () => {
      const response = await POST(
        makeRequest({ tags: [] }, `Bearer ${SECRET}`),
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 when a tag is an empty string", async () => {
      const response = await POST(
        makeRequest({ tags: [""] }, `Bearer ${SECRET}`),
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 when more than 100 tags are sent", async () => {
      const tags = Array.from({ length: 101 }, (_, i) => `post:slug-${i}`);

      const response = await POST(makeRequest({ tags }, `Bearer ${SECRET}`));

      expect(response.status).toBe(400);
    });

    it("should return 400 naming disallowed tags and revalidate nothing", async () => {
      const response = await POST(
        makeRequest(
          { tags: ["usage", "github:stars", "post:", "anything"] },
          `Bearer ${SECRET}`,
        ),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "Tags not allowed",
        rejected: ["github:stars", "post:", "anything"],
      });
      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });
  });

  describe("revalidation", () => {
    it("should call revalidateTag once per unique tag", async () => {
      const tags = [
        "post:hello-world",
        "mdx:hello-world",
        "related:hello-world",
        "posts:list",
        "posts:count",
        "posts:featured",
        "usage",
        "models:providers",
        "posts:list",
      ];

      const response = await POST(makeRequest({ tags }, `Bearer ${SECRET}`));
      const unique = [...new Set(tags)];

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ revalidated: unique });
      expect(mockRevalidateTag).toHaveBeenCalledTimes(unique.length);
      for (const tag of unique) {
        expect(mockRevalidateTag).toHaveBeenCalledWith(tag, "max");
      }
    });
  });
});

describe("other methods", () => {
  it.each([
    ["GET", GET],
    ["HEAD", HEAD],
    ["PUT", PUT],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
  ])("should return 405 for %s", async (_, handler) => {
    const response = await handler();

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
  });
});
