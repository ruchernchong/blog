import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js",
  () => ({
    WebStandardStreamableHTTPServerTransport: vi.fn(function (this: {
      handleRequest: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    }) {
      this.handleRequest = vi
        .fn()
        .mockResolvedValue(Response.json({ result: "ok" }, { status: 200 }));
      this.close = vi.fn().mockResolvedValue(undefined);
    }),
  }),
);

vi.mock("@workspace/mcp/server", () => ({
  createServer: vi.fn().mockReturnValue({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@workspace/mcp/revalidate-tags", () => ({
  revalidateTags: vi.fn(),
}));

// The real challenge module reads BETTER_AUTH_URL when it loads.
vi.hoisted(() => {
  process.env.BETTER_AUTH_URL = "https://auth.test";
});

vi.mock("./auth", () => ({
  validateMcpAuth: vi.fn(),
}));

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { revalidateTags } from "@workspace/mcp/revalidate-tags";
import { createServer } from "@workspace/mcp/server";
import { type McpAuthResult, validateMcpAuth } from "./auth";
import worker from "./index";

const mockValidateMcpAuth = vi.mocked(validateMcpAuth);

function authResult(role: string, scopes: string[]): McpAuthResult {
  return {
    type: "oauth",
    user: { id: "user-1", email: "owner@example.com", name: "Owner", role },
    authInfo: { token: "oauth-token", clientId: "client-1", scopes },
  };
}

function request(method: string, path = "/mcp") {
  return new Request(`https://worker.test${path}`, { method });
}

describe("MCP Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /mcp", () => {
    it("should return 401 with a bearer challenge when unauthenticated", async () => {
      mockValidateMcpAuth.mockResolvedValue(null);

      const response = await worker.fetch(request("POST"));

      expect(response.status).toBe(401);
      expect(response.headers.get("WWW-Authenticate")).toBe(
        'Bearer scope="mcp", resource_metadata="https://worker.test/.well-known/oauth-protected-resource/mcp"',
      );
      expect(createServer).not.toHaveBeenCalled();
    });

    it("should return 403 insufficient_scope without the mcp scope", async () => {
      mockValidateMcpAuth.mockResolvedValue(authResult("admin", ["openid"]));

      const response = await worker.fetch(request("POST"));

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "insufficient_scope" });
      expect(response.headers.get("WWW-Authenticate")).toBe(
        `Bearer error="insufficient_scope", error_description="The 'mcp' scope is required to access this resource", scope="mcp", resource_metadata="https://worker.test/.well-known/oauth-protected-resource/mcp"`,
      );
    });

    it("should return 403 for a non-admin user", async () => {
      mockValidateMcpAuth.mockResolvedValue(authResult("user", ["mcp"]));

      const response = await worker.fetch(request("POST"));

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Forbidden" });
    });

    it("should handle the request with a stateless server for an admin", async () => {
      const auth = authResult("admin", ["mcp"]);
      mockValidateMcpAuth.mockResolvedValue(auth);

      const req = request("POST");
      const response = await worker.fetch(req);

      expect(response.status).toBe(200);
      expect(WebStandardStreamableHTTPServerTransport).toHaveBeenCalledWith({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      expect(createServer).toHaveBeenCalledWith({
        revalidateTags,
        localFiles: false,
      });

      const transport = vi.mocked(WebStandardStreamableHTTPServerTransport).mock
        .instances[0];
      expect(transport.handleRequest).toHaveBeenCalledWith(req, {
        authInfo: auth.authInfo,
      });
      expect(transport.close).toHaveBeenCalled();
      expect(
        vi.mocked(createServer).mock.results[0].value.close,
      ).toHaveBeenCalled();
    });
  });

  describe("GET discovery and health", () => {
    it.each([
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/mcp",
    ])("should serve the protected-resource metadata at %s", async (path) => {
      const response = await worker.fetch(request("GET", path));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        resource: "https://mcp.ruchern.dev/mcp",
        authorization_servers: ["https://auth.test/api/auth"],
        jwks_uri: "https://auth.test/api/auth/jwks",
        scopes_supported: [
          "openid",
          "profile",
          "email",
          "offline_access",
          "mcp",
        ],
        bearer_methods_supported: ["header"],
      });
      expect(mockValidateMcpAuth).not.toHaveBeenCalled();
    });

    it("should return 200 for /health", async () => {
      const response = await worker.fetch(request("GET", "/health"));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        status: "ok",
        service: "mcp-blog",
      });
    });

    it("should return 404 for other well-known paths", async () => {
      const response = await worker.fetch(
        request("GET", "/.well-known/oauth-protected-resource/other"),
      );

      expect(response.status).toBe(404);
    });

    it.each([
      "/health",
      "/.well-known/oauth-protected-resource",
    ])("should return 404 for POST %s", async (path) => {
      const response = await worker.fetch(request("POST", path));

      expect(response.status).toBe(404);
      expect(mockValidateMcpAuth).not.toHaveBeenCalled();
    });
  });

  describe("other methods", () => {
    it.each([
      "GET",
      "DELETE",
      "PUT",
      "PATCH",
      "HEAD",
    ])("should return 405 for %s", async (method) => {
      const response = await worker.fetch(request(method));

      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
      expect(mockValidateMcpAuth).not.toHaveBeenCalled();
    });

    it("should return 204 for OPTIONS", async () => {
      const response = await worker.fetch(request("OPTIONS"));

      expect(response.status).toBe(204);
      expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
    });

    it("should return 404 for other paths", async () => {
      const response = await worker.fetch(request("POST", "/"));

      expect(response.status).toBe(404);
      expect(mockValidateMcpAuth).not.toHaveBeenCalled();
    });
  });
});
