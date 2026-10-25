import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { eq } from "drizzle-orm";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import { logWarning } from "@/lib/logger";
import { db, oauthClient, user } from "@/schema";

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

/** The claims of a verified access token that the user lookup reads. */
interface AccessTokenClaims {
  sub?: string;
  azp?: unknown;
  scope?: unknown;
}

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

/**
 * Loads the owning user for a verified access token payload. It imports
 * neither Next.js nor Better Auth, so the MCP Worker shares it.
 */
export async function resolveOAuthUser(
  token: string,
  payload: AccessTokenClaims,
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
