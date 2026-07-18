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

// Mock the core verifier so OAuth token verification is exercised without a
// real JWKS roundtrip. verifyBearerToken resolves a JWT payload or throws.
vi.mock("better-auth/oauth2", () => ({
  verifyBearerToken: vi.fn(),
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
    oauthClient: { clientId: {}, disabled: {} },
  };
});

// eq() builds a SQL expression from real columns; with mocked plain-object
// columns we stub it to a harmless no-op.
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, eq: vi.fn(() => ({})) };
});

// Pin OAUTH_RESOURCE so the audience/issuer assertion is independent of the
// test environment's BETTER_AUTH_URL.
vi.mock("@/lib/api/oauth-protected-resource", () => ({
  OAUTH_RESOURCE: "https://auth.test/api/auth",
}));

import { verifyBearerToken } from "better-auth/oauth2";
import { OAUTH_RESOURCE } from "@/lib/api/oauth-protected-resource";
import { auth } from "@/lib/auth";
import { db } from "@/schema";
import { validateMcpAuth } from "../mcp-auth";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
  typeof vi.fn
>;

const mockVerifyAccessToken = verifyBearerToken as unknown as ReturnType<
  typeof vi.fn
>;

const mockUserLimit = (
  db.select as unknown as () => { limit: ReturnType<typeof vi.fn> }
)().limit;

function makeRequest(token: string | null, path = "/api/mcp") {
  const url = `http://localhost${path}`;
  if (token === null) return new Request(url);
  return new Request(url, { headers: { Authorization: `Bearer ${token}` } });
}

describe("validateMcpAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
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

      const result = await validateMcpAuth(makeRequest("session-token-abc"));

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
      process.env.BLOG_MCP_AUTH_TOKEN = "static-token";
      const result = await validateMcpAuth(makeRequest("invalid-token"));
      expect(result).toBeNull();
    });

    it("should return null when session user is missing", async () => {
      mockGetSession.mockResolvedValue({ session: { token: "abc" } });
      process.env.BLOG_MCP_AUTH_TOKEN = "static-token";
      const result = await validateMcpAuth(makeRequest("some-token"));
      expect(result).toBeNull();
    });
  });

  describe("static token fallback", () => {
    it("should return token auth when static MCP token matches", async () => {
      process.env.BLOG_MCP_AUTH_TOKEN = "mcp-static-token";
      const result = await validateMcpAuth(makeRequest("mcp-static-token"));
      expect(result).not.toBeNull();
      expect(result?.type).toBe("token");
      expect(result?.user).toBeUndefined();
      expect(result?.authInfo).toBeUndefined();
    });

    it("should return null when static token does not match", async () => {
      process.env.BLOG_MCP_AUTH_TOKEN = "correct-token";
      const result = await validateMcpAuth(makeRequest("wrong-token"));
      expect(result).toBeNull();
    });

    it("should return null when static token is not configured", async () => {
      const result = await validateMcpAuth(makeRequest("some-token"));
      expect(result).toBeNull();
    });
  });

  describe("oauth access token", () => {
    it("should return oauth auth for a valid JWT access token", async () => {
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

      const result = await validateMcpAuth(
        makeRequest("oauth-access-token", "/api/usage/ingest"),
      );

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

    it("should verify the token against the OAuth issuer as audience and issuer", async () => {
      mockVerifyAccessToken.mockResolvedValue({
        sub: "user-1",
        scope: "openid",
      });

      await validateMcpAuth(
        makeRequest("oauth-access-token", "/api/usage/ingest"),
      );

      expect(mockVerifyAccessToken).toHaveBeenCalledWith("oauth-access-token", {
        jwksUrl: `${OAUTH_RESOURCE}/jwks`,
        verifyOptions: {
          audience: OAUTH_RESOURCE,
          issuer: OAUTH_RESOURCE,
        },
      });
    });

    it("should return null when verification fails", async () => {
      mockVerifyAccessToken.mockRejectedValue(new Error("token expired"));
      const result = await validateMcpAuth(
        makeRequest("expired-token", "/api/usage/ingest"),
      );
      expect(result).toBeNull();
    });

    it("should return null when the token subject has no matching user", async () => {
      mockVerifyAccessToken.mockResolvedValue({
        sub: "ghost",
        scope: "openid",
      });
      const result = await validateMcpAuth(
        makeRequest("orphan-token", "/api/usage/ingest"),
      );
      expect(result).toBeNull();
    });

    it("should surface the user's role so the route can enforce admin", async () => {
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

      const result = await validateMcpAuth(
        makeRequest("non-admin-token", "/api/usage/ingest"),
      );

      expect(result?.type).toBe("oauth");
      expect(result?.user?.role).toBe("user");
    });

    it("should reject a token whose issuing client is disabled", async () => {
      mockVerifyAccessToken.mockResolvedValue({
        sub: "user-1",
        scope: "openid email mcp",
        azp: "disabled-client",
      });
      // First lookup (the client) reports disabled; the user lookup is never reached.
      mockUserLimit.mockResolvedValueOnce([{ disabled: true }]);

      expect(
        await validateMcpAuth(makeRequest("disabled-client-token")),
      ).toBeNull();
    });

    it("should reject a token whose issuing client no longer exists", async () => {
      mockVerifyAccessToken.mockResolvedValue({
        sub: "user-1",
        scope: "openid email mcp",
        azp: "ghost-client",
      });
      mockUserLimit.mockResolvedValueOnce([]); // client lookup returns nothing

      expect(
        await validateMcpAuth(makeRequest("ghost-client-token")),
      ).toBeNull();
    });

    it("should surface scopes (including mcp) for an enabled client", async () => {
      mockVerifyAccessToken.mockResolvedValue({
        sub: "user-1",
        scope: "openid email mcp",
        azp: "ok-client",
      });
      mockUserLimit
        .mockResolvedValueOnce([{ disabled: false }]) // client lookup
        .mockResolvedValueOnce([
          {
            id: "user-1",
            email: "owner@example.com",
            name: "Owner",
            role: "admin",
          },
        ]); // user lookup

      const result = await validateMcpAuth(makeRequest("ok-token"));

      expect(result?.type).toBe("oauth");
      expect(result?.authInfo?.scopes).toEqual(["openid", "email", "mcp"]);
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

      const result = await validateMcpAuth(
        makeRequest("oauth-access-token", "/api/usage/ingest"),
      );

      expect(result?.type).toBe("session");
      expect(mockVerifyAccessToken).not.toHaveBeenCalled();
    });
  });

  describe("missing auth", () => {
    it("should return null when no authorization header is present", async () => {
      process.env.BLOG_MCP_AUTH_TOKEN = "static-token";
      const result = await validateMcpAuth(makeRequest(null));
      expect(result).toBeNull();
    });

    it("should return null when authorization header is malformed", async () => {
      process.env.BLOG_MCP_AUTH_TOKEN = "static-token";
      const request = new Request("http://localhost/api/mcp", {
        headers: { Authorization: "Basic dXNlcjpwYXNz" },
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
        session: { token: "session-token" },
      };
      mockGetSession.mockResolvedValue(mockSession);
      process.env.BLOG_MCP_AUTH_TOKEN = "session-token";

      const request = makeRequest("session-token");
      const result = await validateMcpAuth(request);

      expect(result?.type).toBe("session");
      expect(mockGetSession).toHaveBeenCalledWith({ headers: request.headers });
    });
  });
});
