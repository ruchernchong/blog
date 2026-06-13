import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, oauthAccessToken, user as userTable } from "@/schema";

export interface McpAuthResult {
  type: "session" | "token" | "oauth";
  user?: {
    id: string;
    email: string;
    name: string;
    role: string | null | undefined;
  };
  authInfo?: AuthInfo;
}

/**
 * Validates MCP API authentication using a layered strategy:
 * 1. Better Auth session (primary) — validates bearer token or cookie session
 * 2. OAuth access token (oidcProvider) — for OAuth clients that obtain a
 *    user-scoped token via the Authorization Code flow with PKCE
 * 3. Static MCP token (fallback) — retained for headless MCP/CLI clients until
 *    they migrate off it
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
    const authInfo: AuthInfo = {
      token: session.session.token,
      clientId: session.user.id,
      scopes: ["mcp:read", "mcp:write"],
      extra: {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name,
        userRole: session.user.role,
      },
    };

    return {
      type: "session",
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      authInfo,
    };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  // 2. Try an OAuth access token issued by the oidcProvider plugin.
  // Tokens are stored verbatim, so we look the bearer up directly and resolve
  // the owning user (and role) the same way the plugin's userinfo endpoint does.
  if (token) {
    const [record] = await db
      .select({
        accessTokenExpiresAt: oauthAccessToken.accessTokenExpiresAt,
        clientId: oauthAccessToken.clientId,
        scopes: oauthAccessToken.scopes,
        userId: userTable.id,
        userEmail: userTable.email,
        userName: userTable.name,
        userRole: userTable.role,
      })
      .from(oauthAccessToken)
      .innerJoin(userTable, eq(oauthAccessToken.userId, userTable.id))
      .where(eq(oauthAccessToken.accessToken, token))
      .limit(1);

    if (record && record.accessTokenExpiresAt > new Date()) {
      const scopes = record.scopes.split(" ").filter(Boolean);

      const authInfo: AuthInfo = {
        token,
        clientId: record.clientId,
        scopes,
        extra: {
          userId: record.userId,
          userEmail: record.userEmail,
          userName: record.userName,
          userRole: record.userRole,
        },
      };

      return {
        type: "oauth",
        user: {
          id: record.userId,
          email: record.userEmail,
          name: record.userName,
          role: record.userRole,
        },
        authInfo,
      };
    }
  }

  // 3. Fall back to static MCP token
  if (token && token === process.env.BLOG_MCP_AUTH_TOKEN) {
    return { type: "token" };
  }

  // 4. No valid auth
  return null;
}
