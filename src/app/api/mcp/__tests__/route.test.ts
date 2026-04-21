import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js",
  () => ({
    WebStandardStreamableHTTPServerTransport: vi.fn(() => ({
      handleRequest: vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ result: "ok" }), { status: 200 }),
        ),
    })),
  }),
);

vi.mock("@/mcp/server", () => ({
  createServer: vi.fn().mockReturnValue({
    connect: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/lib/api/mcp-auth", () => ({
  validateMcpAuth: vi.fn(),
}));

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { createServer } from "@/mcp/server";
import { DELETE, GET, HEAD, POST } from "../route";

const mockValidateMcpAuth = vi.mocked(validateMcpAuth);

describe("MCP API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 401 when auth fails", async () => {
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
    });

    it("should call transport with authInfo when session auth succeeds", async () => {
      mockValidateMcpAuth.mockResolvedValue({
        type: "session",
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
        },
        authInfo: {
          token: "session-token",
          clientId: "user-123",
          scopes: ["mcp:read", "mcp:write"],
        },
      });

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      await POST(request);

      expect(createServer).toHaveBeenCalled();
      expect(WebStandardStreamableHTTPServerTransport).toHaveBeenCalledWith({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      const transportInstance = vi.mocked(
        WebStandardStreamableHTTPServerTransport,
      ).mock.results[0].value;
      expect(transportInstance.handleRequest).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          authInfo: expect.objectContaining({
            token: "session-token",
            clientId: "user-123",
          }),
        }),
      );
    });

    it("should call transport without authInfo when static token auth succeeds", async () => {
      mockValidateMcpAuth.mockResolvedValue({
        type: "token",
      });

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      await POST(request);

      const transportInstance = vi.mocked(
        WebStandardStreamableHTTPServerTransport,
      ).mock.results[0].value;
      expect(transportInstance.handleRequest).toHaveBeenCalledWith(request, {});
    });
  });

  describe("GET", () => {
    it("should return 401 when auth fails", async () => {
      mockValidateMcpAuth.mockResolvedValue(null);

      const request = new Request("http://localhost/api/mcp", {
        headers: { Authorization: "Bearer invalid" },
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return ok status when auth succeeds", async () => {
      mockValidateMcpAuth.mockResolvedValue({
        type: "session",
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
        },
      });

      const request = new Request("http://localhost/api/mcp");

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("ok");
      expect(body.service).toBe("mcp-blog");
    });
  });

  describe("DELETE", () => {
    it("should return 401 when auth fails", async () => {
      mockValidateMcpAuth.mockResolvedValue(null);

      const request = new Request("http://localhost/api/mcp", {
        method: "DELETE",
        headers: { Authorization: "Bearer invalid" },
      });

      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it("should return 204 when auth succeeds", async () => {
      mockValidateMcpAuth.mockResolvedValue({ type: "token" });

      const request = new Request("http://localhost/api/mcp", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(204);
    });
  });

  describe("HEAD", () => {
    it("should return 401 when auth fails", async () => {
      mockValidateMcpAuth.mockResolvedValue(null);

      const request = new Request("http://localhost/api/mcp", {
        method: "HEAD",
        headers: { Authorization: "Bearer invalid" },
      });

      const response = await HEAD(request);

      expect(response.status).toBe(401);
    });

    it("should return ok status when auth succeeds", async () => {
      mockValidateMcpAuth.mockResolvedValue({ type: "token" });

      const request = new Request("http://localhost/api/mcp", {
        method: "HEAD",
      });

      const response = await HEAD(request);

      expect(response.status).toBe(200);
    });
  });
});
