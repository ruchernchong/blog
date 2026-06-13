import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { eq } from "drizzle-orm";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import { auth } from "@/lib/auth";
import { logWarning } from "@/lib/logger";
import { serverClient } from "@/lib/server-client";
import { db, oauthClient, user } from "@/schema";

type McpUser = {
  id: string;
  email: string;
  name: string;
  role: string | null | undefined;
};

export interface McpAuthResult {
  type: "session" | "token" | "oauth";
  user?: McpUser;
  authInfo?: AuthInfo;
}

/**
 * Builds a user-scoped auth result, deriving both the returned `user` and the
 * MCP `authInfo.extra` payload from a single source so the two never diverge.
 */
function userAuthResult(
  type: "session" | "oauth",
  user: McpUser,
  authInfo: Pick<AuthInfo, "token" | "clientId" | "scopes">,
): McpAuthResult {
  return {
    type,
    user,
    authInfo: {
      ...authInfo,
      extra: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
      },
    },
  };
}

/**
 * Validates MCP API authentication using a layered strategy:
 * 1. Better Auth session (primary) — validates bearer token or cookie session
 * 2. OAuth access token — JWT issued by the OAuth provider plugin, verified
 *    locally against the provider's JWKS, for clients that obtain a
 *    user-scoped token via the Authorization Code flow with PKCE
 * 3. Static MCP token (fallback) — DEPRECATED, marked for deletion. Retained
 *    only until the remote MCP server and `usage:ingest:prod` migrate to OAuth;
 *    remove this branch (and `BLOG_MCP_AUTH_TOKEN`) once they have.
 *
 * @param request - The incoming HTTP request
 * @returns Auth result on success, null on failure
 */
export async function validateMcpAuth(
  request: Request,
): Promise<McpAuthResult | null> {
  // 1. Try Better Auth session first
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (session?.user) {
    return userAuthResult(
      "session",
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      {
        token: session.session.token,
        clientId: session.user.id,
        scopes: ["mcp:read", "mcp:write"],
      },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  // 2. Try a JWT OAuth access token. It is verified locally against the
  // provider's JWKS, then the owning user (and role) is loaded by subject.
  if (token) {
    try {
      const payload = await serverClient.verifyAccessToken(token, {
        verifyOptions: {
          audience: process.env.NEXT_PUBLIC_BASE_URL as string,
        },
      });

      if (payload.sub) {
        const clientId = typeof payload.azp === "string" ? payload.azp : "";

        // Reject tokens whose issuing client has since been disabled (e.g. after
        // a compromise) instead of waiting for the token to expire.
        if (clientId) {
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
            return null;
          }
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

        if (record) {
          return userAuthResult("oauth", record, {
            token,
            clientId,
            scopes:
              typeof payload.scope === "string"
                ? payload.scope.split(" ").filter(Boolean)
                : [],
          });
        }
      }
    } catch {
      // Invalid or non-JWT access token; fall through to the static token.
    }
  }

  // 3. Fall back to static MCP token.
  // TODO(remove): delete this fallback and BLOG_MCP_AUTH_TOKEN once the remote
  // MCP server and usage:ingest:prod authenticate via OAuth.
  if (token && token === process.env.BLOG_MCP_AUTH_TOKEN) {
    return { type: "token" };
  }

  // 4. No valid auth
  return null;
}
