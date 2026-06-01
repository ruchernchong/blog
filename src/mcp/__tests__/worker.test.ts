import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/mcp/http", () => ({
  handleMcpHttpRequest: vi
    .fn()
    .mockResolvedValue(new Response("ok", { status: 200 })),
  validateBearerTokenAuth: vi.fn().mockResolvedValue({ type: "token" }),
}));

vi.mock("@/mcp/tools/media.tools", () => ({
  unsupportedUploadFromPathHandler: vi.fn(),
}));

vi.mock("@/mcp/worker-services", () => ({
  createWorkerPostToolServices: vi.fn(() => ({
    invalidatePost: vi.fn(),
    invalidatePopularPost: vi.fn(),
    invalidateRelatedByTags: vi.fn(),
  })),
}));

import { handleMcpHttpRequest, validateBearerTokenAuth } from "@/mcp/http";
import { unsupportedUploadFromPathHandler } from "@/mcp/tools/media.tools";
import { createWorkerPostToolServices } from "@/mcp/worker-services";
import worker from "../worker";

describe("MCP Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DATABASE_URL;
  });

  it("should bind Worker env and delegate to the shared MCP HTTP handler", async () => {
    const request = new Request("https://mcp.ruchern.dev/mcp", {
      method: "POST",
    });

    const response = await worker.fetch(request, {
      BLOG_MCP_AUTH_TOKEN: "worker-token",
      DATABASE_URL: "postgres://example",
    });

    expect(response.status).toBe(200);
    expect(process.env.DATABASE_URL).toBe("postgres://example");
    expect(createWorkerPostToolServices).toHaveBeenCalled();
    expect(handleMcpHttpRequest).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        server: expect.objectContaining({
          media: {
            uploadFromPathHandler: unsupportedUploadFromPathHandler,
          },
        }),
      }),
    );
  });

  it("should authenticate with the Worker bearer token", async () => {
    const request = new Request("https://mcp.ruchern.dev/mcp", {
      method: "GET",
      headers: {
        Authorization: "Bearer worker-token",
      },
    });

    await worker.fetch(request, {
      BLOG_MCP_AUTH_TOKEN: "worker-token",
    });

    const options = vi.mocked(handleMcpHttpRequest).mock.calls[0][1];
    await options.authenticate(request);

    expect(validateBearerTokenAuth).toHaveBeenCalledWith(
      request,
      "worker-token",
    );
  });
});
