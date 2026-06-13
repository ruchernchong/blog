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

// Mock the resource client so OAuth token verification is exercised without a
// real JWKS roundtrip. verifyAccessToken resolves a JWT payload or throws.
vi.mock("@/lib/server-client", () => ({
  serverClient: {
    verifyAccessToken: vi.fn(),
  },
}));

// Mock the database layer so the user lookup is exercised without a real
// connection. db.select() returns a stable chainable whose terminal .limit()
// resolves to the rows a test supplies.
vi.mock("@/schema", () => {
  const limit = vi.fn().mockResolvedValue([]);
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit,
  };
  return {
    db: { select: vi.fn(() => chain) },
    user: { id: {}, email: {}, name: {}, role: {} },
  };
});

// eq() builds a SQL expression from real columns; with mocked plain-object
// columns we stub it to a harmless no-op.
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, eq: vi.fn(() => ({})) };
});

import { auth } from "@/lib/auth";
import { serverClient } from "@/lib/server-client";
import { db } from "@/schema";
import { validateMcpAuth } from "../mcp-auth";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
  typeof vi.fn
>;

const mockVerifyAccessToken =
  serverClient.verifyAccessToken as unknown as ReturnType<typeof vi.fn>;

const mockUserLimit = (
  db.select as unknown as () => { limit: ReturnType<typeof vi.fn> }
)().limit;

describe("validateMcpAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLimit.mockResolvedValue([]);
    // Default: an unrecognised bearer fails verification and falls through.
    mockVerifyAccessToken.mockRejectedValue(new Error("invalid token"));
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

  describe("oauth access token", () => {
    it("should return oauth auth for a valid JWT access token", async () => {
      mockGetSession.mockResolvedValue(null);
      mockVerifyAccessToken.mockResolvedValue({
        sub: "user-1",
        scope: "openid email",
        azp: "test-client",
      });
      mockUserLimit.mockResolvedValue([
        {
          id: "user-1",
          email: "owner@example.com",
          name: "Owner",
          role: "admin",
        },
      ]);

      const request = new Request("http://localhost/api/usage/ingest", {
        headers: { Authorization: "Bearer oauth-access-token" },
      });

      const result = await validateMcpAuth(request);

      expect(result?.type).toBe("oauth");
      expect(result?.user).toEqual({
        id: "user-1",
        email: "owner@example.com",
        name: "Owner",
        role: "admin",
      });
      expect(result?.authInfo?.token).toBe("oauth-access-token");
      expect(result?.authInfo?.clientId).toBe("test-client");
      expect(result?.authInfo?.scopes).toEqual(["openid", "email"]);
    });

    it("should return null when verification fails", async () => {
      mockGetSession.mockResolvedValue(null);
      mockVerifyAccessToken.mockRejectedValue(new Error("token expired"));

      const request = new Request("http://localhost/api/usage/ingest", {
        headers: { Authorization: "Bearer expired-token" },
      });

      const result = await validateMcpAuth(request);

      expect(result).toBeNull();
    });

    it("should return null when the token subject has no matching user", async () => {
      mockGetSession.mockResolvedValue(null);
      mockVerifyAccessToken.mockResolvedValue({
        sub: "ghost",
        scope: "openid",
      });
      mockUserLimit.mockResolvedValue([]);

      const request = new Request("http://localhost/api/usage/ingest", {
        headers: { Authorization: "Bearer orphan-token" },
      });

      const result = await validateMcpAuth(request);

      expect(result).toBeNull();
    });

    it("should surface the user's role so the route can enforce admin", async () => {
      mockGetSession.mockResolvedValue(null);
      mockVerifyAccessToken.mockResolvedValue({
        sub: "user-2",
        scope: "openid email",
        azp: "test-client",
      });
      mockUserLimit.mockResolvedValue([
        {
          id: "user-2",
          email: "reader@example.com",
          name: "Reader",
          role: "user",
        },
      ]);

      const request = new Request("http://localhost/api/usage/ingest", {
        headers: { Authorization: "Bearer non-admin-token" },
      });

      const result = await validateMcpAuth(request);

      expect(result?.type).toBe("oauth");
      expect(result?.user?.role).toBe("user");
    });

    it("should prefer session auth over an OAuth access token", async () => {
      mockGetSession.mockResolvedValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
        },
        session: { token: "session-token" },
      });

      const request = new Request("http://localhost/api/usage/ingest", {
        headers: { Authorization: "Bearer oauth-access-token" },
      });

      const result = await validateMcpAuth(request);

      expect(result?.type).toBe("session");
      expect(mockVerifyAccessToken).not.toHaveBeenCalled();
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
