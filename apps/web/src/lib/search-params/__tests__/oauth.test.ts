import { createLoader } from "nuqs/server";
import {
  oauthSearchParamKeys,
  oauthSearchParams,
} from "@/lib/search-params/oauth";

const loadOAuthSearchParams = createLoader(oauthSearchParams, {
  urlKeys: oauthSearchParamKeys,
});

describe("oauthSearchParams", () => {
  it("should parse the OAuth client and requested scopes", () => {
    const result = loadOAuthSearchParams(
      "?client_id=client-123&scope=openid+profile+mcp",
    );

    expect(result).toEqual({
      clientId: "client-123",
      scope: "openid profile mcp",
    });
  });

  it("should return null values when OAuth parameters are absent", () => {
    const result = loadOAuthSearchParams("");

    expect(result).toEqual({ clientId: null, scope: null });
  });

  it("should use the first value when a parameter is repeated", () => {
    const result = loadOAuthSearchParams(
      "?client_id=first&client_id=second&scope=openid",
    );

    expect(result.clientId).toBe("first");
  });
});
