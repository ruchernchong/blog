import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { createServer } from "@/mcp/server";

export async function POST(request: Request) {
  const authResult = await validateMcpAuth(request);

  if (!authResult) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const authResult = await validateMcpAuth(request);

  if (!authResult) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ status: "ok", service: "mcp-blog" });
}

export async function DELETE(request: Request) {
  const authResult = await validateMcpAuth(request);

  if (!authResult) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const authResult = await validateMcpAuth(request);

  if (!authResult) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
