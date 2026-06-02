import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { type CreateServerOptions, createServer } from "./server";

export interface McpAuthResult {
  type: "session" | "token";
  authInfo?: AuthInfo;
}

export interface HandleMcpHttpRequestOptions {
  authenticate(request: Request): Promise<McpAuthResult | null>;
  server?: CreateServerOptions;
}

export async function validateBearerTokenAuth(
  request: Request,
  expectedToken?: string,
): Promise<McpAuthResult | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token && expectedToken && token === expectedToken) {
    return { type: "token" };
  }

  return null;
}

export async function handleMcpHttpRequest(
  request: Request,
  options: HandleMcpHttpRequestOptions,
): Promise<Response> {
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { Allow: "GET, HEAD, POST, DELETE, OPTIONS" },
    });
  }

  if (!["GET", "HEAD", "POST", "DELETE"].includes(method)) {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "GET, HEAD, POST, DELETE, OPTIONS" } },
    );
  }

  const authResult = await options.authenticate(request);

  if (!authResult) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (method === "GET") {
    return Response.json({ status: "ok", service: "mcp-blog" });
  }

  if (method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: { "X-MCP-Service": "mcp-blog" },
    });
  }

  if (method === "DELETE") {
    return new Response(null, { status: 204 });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createServer(options.server);
  await server.connect(transport);

  const handleOptions: { authInfo?: AuthInfo } = {};
  if (authResult.authInfo) {
    handleOptions.authInfo = authResult.authInfo;
  }

  return transport.handleRequest(request, handleOptions);
}
