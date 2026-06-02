import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Better Auth before importing the module under test
vi.mock("@/lib/auth", () => {
  const mockGetSession = vi.fn();
  return {
    auth: {
      api: {
        getSession: mockGetSession,
      },
    },
  };
});

import { auth } from "@/lib/auth";
import { validateMcpAuth } from "../mcp-auth";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
  typeof vi.fn
>;

describe("validateMcpAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BLOG_MCP_AUTH_TOKEN;
  });

  describe("session-based auth", () => {
    it("should return session auth when Better Auth session is valid", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
        },
        session: {
          token: "session-token-abc",
        },
      };
      mockGetSession.mockResolvedValue(mockSession);

      const request = new Request("http://localhost/api/mcp", {
        headers: {
          Authorization: "Bearer session-token-abc",
        },
      });

      const result = await validateMcpAuth(request);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("session");
      expect(result?.user).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "admin",
      });
      expect(result?.authInfo).toBeDefined();
      expect(result?.authInfo?.token).toBe("session-token-abc");
      expect(result?.authInfo?.clientId).toBe("user-123");
      expect(result?.authInfo?.extra).toEqual({
        userId: "user-123",
        userEmail: "test@example.com",
        userName: "Test User",
        userRole: "admin",
      });
    });

    it("should return null when session is not found", async () => {
      mockGetSession.mockResolvedValue(null);
      process.env.BLOG_MCP_AUTH_TOKEN = "static-token";

      const request = new Request("http://localhost/api/mcp", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      const result = await validateMcpAuth(request);

      expect(result).toBeNull();
    });

    it("should return null when session user is missing", async () => {
      mockGetSession.mockResolvedValue({ session: { token: "abc" } });
      process.env.BLOG_MCP_AUTH_TOKEN = "static-token";

      const request = new Request("http://localhost/api/mcp", {
        headers: {
          Authorization: "Bearer some-token",
        },
      });

      const result = await validateMcpAuth(request);

      expect(result).toBeNull();
    });
  });

  describe("static token fallback", () => {
    it("should return token auth when static MCP token matches", async () => {
      mockGetSession.mockResolvedValue(null);
      process.env.BLOG_MCP_AUTH_TOKEN = "mcp-static-token";

      const request = new Request("http://localhost/api/mcp", {
        headers: {
          Authorization: "Bearer mcp-static-token",
        },
      });

      const result = await validateMcpAuth(request);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("token");
      expect(result?.user).toBeUndefined();
      expect(result?.authInfo).toBeUndefined();
    });

    it("should return null when static token does not match", async () => {
      mockGetSession.mockResolvedValue(null);
      process.env.BLOG_MCP_AUTH_TOKEN = "correct-token";

      const request = new Request("http://localhost/api/mcp", {
        headers: {
          Authorization: "Bearer wrong-token",
        },
      });

      const result = await validateMcpAuth(request);

      expect(result).toBeNull();
    });

    it("should return null when static token is not configured", async () => {
      mockGetSession.mockResolvedValue(null);

      const request = new Request("http://localhost/api/mcp", {
        headers: {
          Authorization: "Bearer some-token",
        },
      });

      const result = await validateMcpAuth(request);

      expect(result).toBeNull();
    });
  });

  describe("missing auth", () => {
    it("should return null when no authorization header is present", async () => {
      mockGetSession.mockResolvedValue(null);
      process.env.BLOG_MCP_AUTH_TOKEN = "static-token";

      const request = new Request("http://localhost/api/mcp");

      const result = await validateMcpAuth(request);

      expect(result).toBeNull();
    });

    it("should return null when authorization header is malformed", async () => {
      mockGetSession.mockResolvedValue(null);
      process.env.BLOG_MCP_AUTH_TOKEN = "static-token";

      const request = new Request("http://localhost/api/mcp", {
        headers: {
          Authorization: "Basic dXNlcjpwYXNz",
        },
      });

      const result = await validateMcpAuth(request);

      expect(result).toBeNull();
    });
  });

  describe("priority order", () => {
    it("should prefer session auth over static token when both are valid", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
        },
        session: {
          token: "session-token",
        },
      };
      mockGetSession.mockResolvedValue(mockSession);
      process.env.BLOG_MCP_AUTH_TOKEN = "session-token";

      const request = new Request("http://localhost/api/mcp", {
        headers: {
          Authorization: "Bearer session-token",
        },
      });

      const result = await validateMcpAuth(request);

      expect(result?.type).toBe("session");
      expect(mockGetSession).toHaveBeenCalledWith({
        headers: request.headers,
      });
    });
  });
});
