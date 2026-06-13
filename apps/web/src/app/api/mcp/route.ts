import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "@workspace/mcp/server";
import { type McpAuthResult, validateMcpAuth } from "@/lib/api/mcp-auth";
import { bearerChallenge, MCP_SCOPE } from "@/lib/api/oauth-protected-resource";

/**
 * Authenticates the request and enforces the `mcp` scope on OAuth tokens.
 * Returns the auth result, or a ready-to-send challenge response: 401 for an
 * unauthenticated request, 403 `insufficient_scope` for a valid OAuth token that
 * lacks the `mcp` scope. Session and static-token auth are already trusted.
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

  if (
    authResult.type === "oauth" &&
    !authResult.authInfo?.scopes?.includes(MCP_SCOPE)
  ) {
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

  if (authResult.type === "oauth" && authResult.user?.role !== "admin") {
    return {
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authResult };
}

export async function POST(request: Request) {
  const gate = await requireMcpAuth(request);
  if ("error" in gate) return gate.error;
  const { authResult } = gate;

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createServer();
  await server.connect(transport);

  const handleOptions: { authInfo?: AuthInfo } = {};
  if (authResult.authInfo) {
    handleOptions.authInfo = authResult.authInfo;
  }

  return transport.handleRequest(request, handleOptions);
}

export async function GET(request: Request) {
  const gate = await requireMcpAuth(request);
  if ("error" in gate) return gate.error;

  return Response.json({ status: "ok", service: "mcp-blog" });
}

export async function DELETE(request: Request) {
  const gate = await requireMcpAuth(request);
  if ("error" in gate) return gate.error;

  return new Response(null, { status: 204 });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, DELETE, OPTIONS",
    },
  });
}

export async function HEAD(request: Request) {
  const gate = await requireMcpAuth(request);
  if ("error" in gate) return gate.error;

  return Response.json({ status: "ok", service: "mcp-blog" });
}

export async function PUT() {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET, POST, DELETE, OPTIONS" } },
  );
}

export async function PATCH() {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET, POST, DELETE, OPTIONS" } },
  );
}
