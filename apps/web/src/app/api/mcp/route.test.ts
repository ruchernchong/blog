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
        .mockResolvedValue(
          new Response(JSON.stringify({ result: "ok" }), { status: 200 }),
        );
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

vi.mock("@/lib/api/mcp-auth", () => ({
  validateMcpAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "@workspace/mcp/server";
import { revalidateTag } from "next/cache";
import { type McpAuthResult, validateMcpAuth } from "@/lib/api/mcp-auth";
import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from "./route";

const mockValidateMcpAuth = vi.mocked(validateMcpAuth);

const adminOAuth: McpAuthResult = {
  type: "oauth",
  user: {
    id: "user-1",
    email: "owner@example.com",
    name: "Owner",
    role: "admin",
  },
  authInfo: {
    token: "oauth-token",
    clientId: "client-1",
    scopes: ["openid", "email", "mcp"],
  },
};

describe("MCP API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 401 with a WWW-Authenticate challenge when auth fails", async () => {
      mockValidateMcpAuth.mockResolvedValue(null);

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        headers: { Authorization: "Bearer invalid" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
      const challenge = response.headers.get("WWW-Authenticate");
      expect(challenge).toContain('scope="mcp"');
      expect(challenge).toContain("resource_metadata=");
    });

    it("should return 403 insufficient_scope when an OAuth token lacks the mcp scope", async () => {
      mockValidateMcpAuth.mockResolvedValue({
        type: "oauth",
        user: {
          id: "user-1",
          email: "owner@example.com",
          name: "Owner",
          role: "admin",
        },
        authInfo: {
          token: "oauth-token",
          clientId: "client-1",
          scopes: ["openid", "email"],
        },
      });

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        headers: { Authorization: "Bearer oauth-token" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("insufficient_scope");
      expect(response.headers.get("WWW-Authenticate")).toContain(
        'error="insufficient_scope"',
      );
    });

    it("should return 403 when the OAuth user is not an admin", async () => {
      mockValidateMcpAuth.mockResolvedValue({
        ...adminOAuth,
        user: { ...adminOAuth.user, role: "user" },
      });

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(createServer).not.toHaveBeenCalled();
    });

    it("should forward an OAuth token that carries the mcp scope", async () => {
      mockValidateMcpAuth.mockResolvedValue({
        type: "oauth",
        user: {
          id: "user-1",
          email: "owner@example.com",
          name: "Owner",
          role: "admin",
        },
        authInfo: {
          token: "oauth-token",
          clientId: "client-1",
          scopes: ["openid", "email", "mcp"],
        },
      });

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      await POST(request);

      const transportInstance = vi.mocked(
        WebStandardStreamableHTTPServerTransport,
      ).mock.results[0].value;
      expect(transportInstance.handleRequest).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          authInfo: expect.objectContaining({ token: "oauth-token" }),
        }),
      );
    });

    it("should create a server without local files that revalidates each tag with the max profile", async () => {
      mockValidateMcpAuth.mockResolvedValue(adminOAuth);

      await POST(
        new Request("http://localhost/api/mcp", {
          method: "POST",
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
        }),
      );

      const [deps] = vi.mocked(createServer).mock.calls[0];
      expect(deps.localFiles).toBe(false);

      await deps.revalidateTags(["post:hello", "posts:list"]);
      expect(revalidateTag).toHaveBeenCalledWith("post:hello", "max");
      expect(revalidateTag).toHaveBeenCalledWith("posts:list", "max");
    });

    it("should close the server and transport after handling the request", async () => {
      mockValidateMcpAuth.mockResolvedValue(adminOAuth);

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      await POST(request);

      const serverInstance = vi.mocked(createServer).mock.results[0].value;
      const transportInstance = vi.mocked(
        WebStandardStreamableHTTPServerTransport,
      ).mock.results[0].value;
      expect(serverInstance.close).toHaveBeenCalled();
      expect(transportInstance.close).toHaveBeenCalled();
    });

    it("should still clean up when handling the request fails", async () => {
      mockValidateMcpAuth.mockResolvedValue(adminOAuth);
      vi.mocked(
        WebStandardStreamableHTTPServerTransport,
      ).mockImplementationOnce(function (
        this: WebStandardStreamableHTTPServerTransport,
      ) {
        this.handleRequest = vi
          .fn()
          .mockRejectedValue(
            new Error("transport exploded"),
          ) as unknown as typeof this.handleRequest;
        this.close = vi
          .fn()
          .mockResolvedValue(undefined) as unknown as typeof this.close;
      });

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      await expect(POST(request)).rejects.toThrow("transport exploded");

      const serverInstance = vi.mocked(createServer).mock.results[0].value;
      const failedTransport = vi.mocked(
        WebStandardStreamableHTTPServerTransport,
      ).mock.results[0].value;
      expect(serverInstance.close).toHaveBeenCalled();
      expect(failedTransport.close).toHaveBeenCalled();
    });
  });

  describe.each([
    ["GET", GET],
    ["DELETE", DELETE],
    ["HEAD", HEAD],
    ["PUT", PUT],
    ["PATCH", PATCH],
  ])("%s (stateless)", (_method, handler) => {
    it("should return 405 without requiring auth", async () => {
      const response = await (handler as () => Promise<Response>)();

      expect(response.status).toBe(405);
      const body = await response.json();
      expect(body.error).toBe("Method not allowed");
      expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
      expect(mockValidateMcpAuth).not.toHaveBeenCalled();
      expect(createServer).not.toHaveBeenCalled();
      expect(WebStandardStreamableHTTPServerTransport).not.toHaveBeenCalled();
    });
  });

  describe("OPTIONS", () => {
    it("should return 204 preflight without requiring auth", async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(204);
      expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
      expect(mockValidateMcpAuth).not.toHaveBeenCalled();
    });
  });
});
