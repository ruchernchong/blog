import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock jose so verification runs without a real JWKS roundtrip. jwtVerify
// resolves `{ payload }` or throws.
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => "jwks"),
  jwtVerify: vi.fn(),
}));

// Mock the database layer: db.select() returns a stable chainable whose
// terminal .limit() resolves to the rows a test supplies.
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

vi.mock("@/lib/api/oauth-protected-resource", () => ({
  OAUTH_RESOURCE: "https://auth.test/api/auth",
  MCP_WORKER_RESOURCE: "https://worker.test/mcp",
}));

vi.mock("@/lib/logger", () => ({ logWarning: vi.fn() }));

import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "@/schema";
import { validateMcpAuth } from "./auth";

// Captured before any per-test mock reset clears the module-scope call.
const jwksUrl = vi.mocked(createRemoteJWKSet).mock.calls[0]?.[0];
const mockJwtVerify = vi.mocked(jwtVerify);
const mockLimit = (
  db.select as unknown as () => { limit: ReturnType<typeof vi.fn> }
)().limit;

const adminRow = {
  id: "user-1",
  email: "owner@example.com",
  name: "Owner",
  role: "admin",
};

function makeRequest(authorization?: string) {
  return new Request("https://worker.test/mcp", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });
}

function verifiedPayload(payload: Record<string, unknown>) {
  mockJwtVerify.mockResolvedValue({
    payload,
    protectedHeader: { alg: "EdDSA" },
  } as Awaited<ReturnType<typeof jwtVerify>>);
}

describe("validateMcpAuth", () => {
  beforeEach(() => {
    mockJwtVerify.mockReset().mockRejectedValue(new Error("invalid token"));
    mockLimit.mockReset().mockResolvedValue([]);
  });

  it("should fetch the JWKS from the provider", () => {
    expect(jwksUrl).toEqual(new URL("https://auth.test/api/auth/jwks"));
  });

  it("should return null without a bearer header", async () => {
    expect(await validateMcpAuth(makeRequest())).toBeNull();
    expect(await validateMcpAuth(makeRequest("Basic abc"))).toBeNull();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it("should return null when verification fails", async () => {
    expect(await validateMcpAuth(makeRequest("Bearer bad"))).toBeNull();
  });

  it("should verify the Worker audience and the provider issuer", async () => {
    verifiedPayload({ sub: "user-1", scope: "mcp" });
    mockLimit.mockResolvedValueOnce([adminRow]);

    await validateMcpAuth(makeRequest("Bearer good"));

    expect(mockJwtVerify).toHaveBeenCalledWith("good", "jwks", {
      audience: "https://worker.test/mcp",
      issuer: "https://auth.test/api/auth",
    });
  });

  it("should return the user and scopes for a valid token", async () => {
    verifiedPayload({ sub: "user-1", scope: "openid mcp", azp: "client-1" });
    mockLimit
      .mockResolvedValueOnce([{ disabled: false }])
      .mockResolvedValueOnce([adminRow]);

    const result = await validateMcpAuth(makeRequest("Bearer good"));

    expect(result?.user).toEqual(adminRow);
    expect(result?.authInfo).toMatchObject({
      token: "good",
      clientId: "client-1",
      scopes: ["openid", "mcp"],
    });
  });

  it("should return null when the issuing client is disabled", async () => {
    verifiedPayload({ sub: "user-1", scope: "mcp", azp: "client-1" });
    mockLimit.mockResolvedValueOnce([{ disabled: true }]);

    expect(await validateMcpAuth(makeRequest("Bearer good"))).toBeNull();
  });

  it("should return null when the subject is not a known user", async () => {
    verifiedPayload({ sub: "ghost", scope: "mcp" });

    expect(await validateMcpAuth(makeRequest("Bearer good"))).toBeNull();
  });

  it("should return null for a DPoP-bound token", async () => {
    verifiedPayload({ sub: "user-1", scope: "mcp", cnf: { jkt: "thumb" } });
    mockLimit.mockResolvedValueOnce([adminRow]);

    expect(await validateMcpAuth(makeRequest("Bearer good"))).toBeNull();
  });

  it.each([
    ["a non-string", ["mcp"]],
    ["an empty", ""],
    ["a double-spaced", "mcp  openid"],
    ["an invalid-character", 'mcp "openid"'],
  ])("should return null for %s scope claim", async (_label, scope) => {
    verifiedPayload({ sub: "user-1", scope });
    mockLimit.mockResolvedValueOnce([adminRow]);

    expect(await validateMcpAuth(makeRequest("Bearer good"))).toBeNull();
  });
});
