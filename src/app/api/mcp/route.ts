import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "@/mcp/server";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== process.env.BLOG_MCP_AUTH_TOKEN) {
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

export async function GET() {
  return Response.json({ status: "ok", service: "mcp-blog" });
}
