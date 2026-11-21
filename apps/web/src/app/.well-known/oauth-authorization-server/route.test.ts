import { describe, expect, it, vi } from "vitest";

const metadata = {
  issuer: "https://ruchern.dev/api/auth",
  authorization_endpoint: "https://ruchern.dev/api/auth/oauth2/authorize",
  token_endpoint: "https://ruchern.dev/api/auth/oauth2/token",
};

vi.mock("@/lib/auth", () => ({
  auth: { api: { getOAuthServerConfig: vi.fn(async () => metadata) } },
}));

import { GET as getForIssuer } from "./api/auth/route";
import { GET } from "./route";

describe("RFC 8414 authorization server metadata", () => {
  it.each([
    ["/.well-known/oauth-authorization-server", GET],
    ["/.well-known/oauth-authorization-server/api/auth", getForIssuer],
  ])("should serve the provider's metadata at %s", async (path, handler) => {
    const response = await handler(new Request(`https://ruchern.dev${path}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toEqual(metadata);
  });

  it.each([
    ["/.well-known/oauth-authorization-server", GET],
    ["/.well-known/oauth-authorization-server/api/auth", getForIssuer],
  ])("should let the CDN cache %s", async (path, handler) => {
    const response = await handler(new Request(`https://ruchern.dev${path}`));

    expect(response.headers.get("Cache-Control")).toContain("s-maxage=86400");
  });
});
