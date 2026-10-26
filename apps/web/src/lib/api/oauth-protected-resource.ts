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

/**
 * The OAuth issuer. Better Auth mounts the provider at `/api/auth`, so the
 * issuer (and therefore the access-token `aud` claim and the only `resource`
 * the provider's `checkResource` accepts) is `BASE_URL` + `/api/auth` — NOT the
 * bare origin. This is the single value the verified token audience, the
 * published `resource`, and the `resource` clients pass to `/oauth2/authorize`
 * must all share for an issued JWT to validate.
 */
export const OAUTH_RESOURCE = `${BASE_URL}/api/auth`;

/**
 * The MCP Worker's resource identifier (RFC 8707): its canonical server URL.
 * MCP clients only accept protected-resource metadata whose `resource` covers
 * the server URL they connect to, so the Worker publishes this, the provider
 * accepts it as a token audience, and the Worker verifies it as `aud`.
 */
export const MCP_WORKER_RESOURCE = "https://mcp.ruchern.dev/mcp";

/**
 * The `/api/mcp` route's resource identifier (RFC 8707). Like the Worker, MCP
 * clients require the published `resource` to cover the server URL, which the
 * issuer (`/api/auth`) does not, so `/api/mcp` publishes and verifies this.
 */
export const MCP_RESOURCE = `${BASE_URL}/api/mcp`;

/** Scope a token must carry to reach the MCP API. */
export const MCP_SCOPE = "mcp";

/** Path of the protected-resource metadata document, relative to the origin. */
export const PROTECTED_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource";

export const protectedResourceMetadataUrl = `${BASE_URL}${PROTECTED_RESOURCE_METADATA_PATH}`;

/** Path-suffixed metadata URL for the `/api/mcp` resource. */
export const mcpResourceMetadataUrl = `${protectedResourceMetadataUrl}/api/mcp`;

export const protectedResourceMetadata = {
  resource: OAUTH_RESOURCE,
  authorization_servers: [OAUTH_RESOURCE],
  jwks_uri: `${OAUTH_RESOURCE}/jwks`,
  scopes_supported: ["openid", "profile", "email", "offline_access", MCP_SCOPE],
  bearer_methods_supported: ["header"],
};

/** The issuer document with `/api/mcp` as `resource`. */
export const mcpResourceMetadata = {
  ...protectedResourceMetadata,
  resource: MCP_RESOURCE,
};

/**
 * Builds a `WWW-Authenticate: Bearer …` challenge that advertises the required
 * scope and the metadata document so MCP clients can discover the auth server.
 * Pass `insufficient_scope` when a valid token simply lacks the `mcp` scope, and
 * `metadataUrl` when the resource is served from another origin (the Worker).
 */
export function bearerChallenge(
  error?: "insufficient_scope",
  metadataUrl = protectedResourceMetadataUrl,
): string {
  const parts: string[] = [];
  if (error) {
    parts.push(
      `error="${error}"`,
      `error_description="The '${MCP_SCOPE}' scope is required to access this resource"`,
    );
  }
  parts.push(`scope="${MCP_SCOPE}"`, `resource_metadata="${metadataUrl}"`);
  return `Bearer ${parts.join(", ")}`;
}
