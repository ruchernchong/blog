import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { serverClient } from "@/lib/server-client";
import { db, user } from "@/schema";

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
            clientId: typeof payload.azp === "string" ? payload.azp : "",
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

  // 3. Fall back to static MCP token
  if (token && token === process.env.BLOG_MCP_AUTH_TOKEN) {
    return { type: "token" };
  }

  // 4. No valid auth
  return null;
}
