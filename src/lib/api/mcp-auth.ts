import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { auth } from "@/lib/auth";

export interface McpAuthResult {
  type: "session" | "token";
  user?: {
    id: string;
    email: string;
    name: string;
    role: string | null | undefined;
  };
  authInfo?: AuthInfo;
}

/**
 * Validates MCP API authentication using a dual-mode strategy:
 * 1. Better Auth session (primary) — validates bearer token or cookie session
 * 2. Static MCP token (fallback) — for existing MCP clients
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

  // 2. Fall back to static MCP token
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token && token === process.env.BLOG_MCP_AUTH_TOKEN) {
    return { type: "token" };
  }

  // 3. No valid auth
  return null;
}
