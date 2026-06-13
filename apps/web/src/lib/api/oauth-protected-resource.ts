/**
 * RFC 9728 OAuth 2.0 Protected Resource Metadata for the MCP API.
 *
 * `@better-auth/oauth-provider` serves authorization-server metadata but
 * deliberately omits the protected-resource document, so we publish it here and
 * point clients at the authorization server. Keeping `resource` aligned with the
 * `audience` that {@link validateMcpAuth} verifies (and the `resource` clients
 * pass to `/oauth2/authorize`) is what lets the issued JWT validate.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9728
 * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
 */

const BASE_URL = process.env.BETTER_AUTH_URL as string;

/** Scope a token must carry to reach the MCP API. */
export const MCP_SCOPE = "mcp";

/** Path of the protected-resource metadata document, relative to the origin. */
export const PROTECTED_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource";

export const protectedResourceMetadataUrl = `${BASE_URL}${PROTECTED_RESOURCE_METADATA_PATH}`;

export const protectedResourceMetadata = {
  resource: BASE_URL,
  authorization_servers: [`${BASE_URL}/api/auth`],
  jwks_uri: `${BASE_URL}/api/auth/jwks`,
  scopes_supported: ["openid", "profile", "email", "offline_access", MCP_SCOPE],
  bearer_methods_supported: ["header"],
};

/**
 * Builds a `WWW-Authenticate: Bearer …` challenge that advertises the required
 * scope and the metadata document so MCP clients can discover the auth server.
 * Pass `insufficient_scope` when a valid token simply lacks the `mcp` scope.
 */
export function bearerChallenge(error?: "insufficient_scope"): string {
  const parts: string[] = [];
  if (error) {
    parts.push(`error="${error}"`);
    parts.push(
      `error_description="The '${MCP_SCOPE}' scope is required to access this resource"`,
    );
  }
  parts.push(`scope="${MCP_SCOPE}"`);
  parts.push(`resource_metadata="${protectedResourceMetadataUrl}"`);
  return `Bearer ${parts.join(", ")}`;
}
