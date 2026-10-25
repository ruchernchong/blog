import { createRemoteJWKSet, jwtVerify } from "jose";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import {
  MCP_WORKER_RESOURCE,
  OAUTH_RESOURCE,
} from "@/lib/api/oauth-protected-resource";
import { type McpAuthResult, resolveOAuthUser } from "@/lib/api/oauth-user";
import { logWarning } from "@/lib/logger";

export type { McpAuthResult };

/** Provider JWKS, fetched and cached per isolate by jose. */
const jwks = createRemoteJWKSet(new URL(`${OAUTH_RESOURCE}/jwks`));

/** An RFC 6749 scope-token, as Better Auth validates it. */
const SCOPE_TOKEN = /^[\x21\x23-\x5b\x5d-\x7e]+$/;

/**
 * Validates MCP API authentication the same way the Next.js app's
 * `validateMcpAuth` does, but with jose instead of Better Auth: the bearer
 * must be a JWT access token verified against the provider's JWKS, whose
 * issuing client is still active and whose subject is a known user.
 *
 * @param request - The incoming HTTP request
 * @returns Auth result on success, null on failure
 */
export async function validateMcpAuth(
  request: Request,
): Promise<McpAuthResult | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length);

  try {
    // Clients request the Worker's own URL as the resource, so it is the
    // token's `aud`; the provider still signs as its issuer (BASE_URL +
    // /api/auth), not the bare origin.
    const { payload } = await jwtVerify(token, jwks, {
      audience: MCP_WORKER_RESOURCE,
      issuer: OAUTH_RESOURCE,
    });

    // Like Better Auth's verifyBearerToken, refuse DPoP-bound tokens: a
    // bearer alone does not prove possession of the bound key.
    const confirmation = payload.cnf as { jkt?: unknown } | undefined;
    if (confirmation?.jkt) {
      throw new Error("DPoP-bound access token presented as a bearer");
    }

    // Like Better Auth's parseGrantedScopes, reject a malformed scope claim
    // (not a string, empty, or with an empty or invalid scope token).
    const { scope } = payload;
    if (
      scope !== undefined &&
      (typeof scope !== "string" ||
        !scope.split(" ").every((token) => SCOPE_TOKEN.test(token)))
    ) {
      throw new Error("access token scope claim is invalid");
    }

    return await resolveOAuthUser(token, payload);
  } catch (error) {
    logWarning("OAuth access token verification failed", {
      errorId: AUTH_ERROR.OAUTH_TOKEN_VALIDATION_FAILED,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
