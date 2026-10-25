import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { verifyBearerToken } from "better-auth/oauth2";
import { eq } from "drizzle-orm";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import { OAUTH_RESOURCE } from "@/lib/api/oauth-protected-resource";
import { logWarning } from "@/lib/logger";
import { db, oauthClient, user } from "@/schema";

/** Provider JWKS endpoint used to verify access-token signatures locally. */
const OAUTH_JWKS_URL = `${OAUTH_RESOURCE}/jwks`;

type McpUser = {
  id: string;
  email: string;
  name: string;
  role: string | null | undefined;
};

export interface McpAuthResult {
  type: "oauth";
  user: McpUser;
  authInfo: AuthInfo;
}

type AccessTokenPayload = Awaited<ReturnType<typeof verifyBearerToken>>;

/**
 * Reject tokens whose issuing client has since been disabled (e.g. after a
 * compromise) instead of waiting for the token to expire.
 */
async function isOAuthClientActive(clientId: string): Promise<boolean> {
  const [client] = await db
    .select({ disabled: oauthClient.disabled })
    .from(oauthClient)
    .where(eq(oauthClient.clientId, clientId))
    .limit(1);

  if (!client || client.disabled) {
    logWarning("OAuth token rejected: client missing or disabled", {
      errorId: AUTH_ERROR.OAUTH_TOKEN_VALIDATION_FAILED,
      clientId,
    });
    return false;
  }

  return true;
}

/** Loads the owning user for a verified access token payload. */
async function resolveOAuthUser(
  token: string,
  payload: AccessTokenPayload,
): Promise<McpAuthResult | null> {
  if (!payload.sub) {
    return null;
  }

  const clientId = typeof payload.azp === "string" ? payload.azp : "";

  if (clientId && !(await isOAuthClientActive(clientId))) {
    return null;
  }

  const [record] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, payload.sub))
    .limit(1);

  if (!record) {
    return null;
  }

  return {
    type: "oauth",
    user: record,
    authInfo: {
      token,
      clientId,
      scopes:
        typeof payload.scope === "string"
          ? payload.scope.split(" ").filter(Boolean)
          : [],
      extra: {
        userId: record.id,
        userEmail: record.email,
        userName: record.name,
        userRole: record.role,
      },
    },
  };
}

/**
 * Validates MCP API authentication. OAuth is the only accepted method: the
 * bearer must be a JWT access token issued by the OAuth provider plugin,
 * verified locally against the provider's JWKS, whose issuing client is still
 * active and whose subject is a known user.
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
    // Verify locally against the provider's published JWKS. We pass the
    // `jwksUrl` explicitly (rather than relying on the resource-client wrapper
    // to resolve it) so verification is self-contained in the serverless
    // runtime — otherwise a valid token fails with "no token payload".
    const payload = await verifyBearerToken(token, {
      jwksUrl: OAUTH_JWKS_URL,
      verifyOptions: {
        // The provider stamps the OIDC issuer (BASE_URL + /api/auth) into the
        // token's `aud`/`iss`, so verify against that — not the bare origin.
        audience: OAUTH_RESOURCE,
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
