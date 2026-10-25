import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "@workspace/mcp/server";
import { methodNotAllowedResponse } from "@/lib/api";
import { type McpAuthResult, validateMcpAuth } from "@/lib/api/mcp-auth";
import { bearerChallenge, MCP_SCOPE } from "@/lib/api/oauth-protected-resource";

/**
 * Authenticates the OAuth bearer and enforces the `mcp` scope and admin role.
 * Returns the auth result, or a ready-to-send challenge response: 401 for an
 * unauthenticated request, 403 `insufficient_scope` for a valid token that
 * lacks the `mcp` scope, 403 for a non-admin user.
 */
async function requireMcpAuth(
  request: Request,
): Promise<{ authResult: McpAuthResult } | { error: Response }> {
  const authResult = await validateMcpAuth(request);

  if (!authResult) {
    return {
      error: Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "WWW-Authenticate": bearerChallenge() } },
      ),
    };
  }

  if (!authResult.authInfo.scopes.includes(MCP_SCOPE)) {
    return {
      error: Response.json(
        { error: "insufficient_scope" },
        {
          status: 403,
          headers: {
            "WWW-Authenticate": bearerChallenge("insufficient_scope"),
          },
        },
      ),
    };
  }

  if (authResult.user.role !== "admin") {
    return {
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authResult };
}

const ALLOW = "POST, OPTIONS";

function methodNotAllowed(): Response {
  return methodNotAllowedResponse(ALLOW);
}

export async function POST(request: Request) {
  const gate = await requireMcpAuth(request);
  if ("error" in gate) return gate.error;
  const { authResult } = gate;

  // Stateless mode: fresh transport + server per request, no session tracking.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createServer();
  await server.connect(transport);

  try {
    return await transport.handleRequest(request, {
      authInfo: authResult.authInfo,
    });
  } finally {
    await server.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

export async function GET() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: ALLOW,
    },
  });
}

export async function HEAD() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}
