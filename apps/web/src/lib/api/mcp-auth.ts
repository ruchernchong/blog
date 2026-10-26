import { verifyBearerToken } from "better-auth/oauth2";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import { OAUTH_RESOURCE } from "@/lib/api/oauth-protected-resource";
import { type McpAuthResult, resolveOAuthUser } from "@/lib/api/oauth-user";
import { logWarning } from "@/lib/logger";

export type { McpAuthResult };

/** Provider JWKS endpoint used to verify access-token signatures locally. */
const OAUTH_JWKS_URL = `${OAUTH_RESOURCE}/jwks`;

/**
 * Validates MCP API authentication. OAuth is the only accepted method: the
 * bearer must be a JWT access token issued by the OAuth provider plugin,
 * verified locally against the provider's JWKS, whose issuing client is still
 * active and whose subject is a known user.
 *
 * @param request - The incoming HTTP request
 * @param audience - The token `aud` this endpoint accepts (defaults to the issuer)
 * @returns Auth result on success, null on failure
 */
export async function validateMcpAuth(
  request: Request,
  audience: string = OAUTH_RESOURCE,
): Promise<McpAuthResult | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length);

  try {
    // Verify locally against the provider's published JWKS. We pass the
    // `jwksUrl` explicitly (rather than relying on the resource-client wrapper
    // to resolve it) so verification is self-contained in the serverless
    // runtime — otherwise a valid token fails with "no token payload".
    const payload = await verifyBearerToken(token, {
      jwksUrl: OAUTH_JWKS_URL,
      verifyOptions: {
        // `iss` is the OIDC issuer (BASE_URL + /api/auth); `aud` is the
        // `resource` the client requested, which must be this endpoint's.
        audience,
        issuer: OAUTH_RESOURCE,
      },
    });

    return await resolveOAuthUser(token, payload);
  } catch (error) {
    logWarning("OAuth access token verification failed", {
      errorId: AUTH_ERROR.OAUTH_TOKEN_VALIDATION_FAILED,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
