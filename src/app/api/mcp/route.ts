import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "@/mcp/server";

function checkAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token === process.env.BLOG_MCP_AUTH_TOKEN;
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createServer();
  await server.connect(transport);

  return transport.handleRequest(request);
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ status: "ok", service: "mcp-blog" });
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
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
  if (!checkAuth(request)) {
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
