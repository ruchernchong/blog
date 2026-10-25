import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { revalidateTags } from "@workspace/mcp/revalidate-tags";
import { createServer } from "@workspace/mcp/server";
import {
  bearerChallenge,
  MCP_SCOPE,
  PROTECTED_RESOURCE_METADATA_PATH,
  protectedResourceMetadata,
} from "@/lib/api/oauth-protected-resource";
import { type McpAuthResult, validateMcpAuth } from "./auth";

/**
 * RFC 9728 metadata paths on the Worker's own origin: the root document and
 * the copy suffixed with the MCP endpoint path, which MCP clients try first
 * when a 401 carries no `resource_metadata`. Both serve the web app's
 * document unchanged, so `resource` stays the provider's issuer and tokens
 * it issues today still validate.
 */
const METADATA_PATHS = new Set([
  PROTECTED_RESOURCE_METADATA_PATH,
  `${PROTECTED_RESOURCE_METADATA_PATH}/mcp`,
]);

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
  // Point clients at this origin's metadata, not the web app's.
  const metadataUrl = `${new URL(request.url).origin}${PROTECTED_RESOURCE_METADATA_PATH}`;

  if (!authResult) {
    return {
      error: Response.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": bearerChallenge(undefined, metadataUrl),
          },
        },
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
            "WWW-Authenticate": bearerChallenge(
              "insufficient_scope",
              metadataUrl,
            ),
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

async function handlePost(request: Request): Promise<Response> {
  const gate = await requireMcpAuth(request);
  if ("error" in gate) return gate.error;
  const { authResult } = gate;

  // Stateless mode: fresh transport + server per request, no session tracking.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  // No local filesystem, and writes revalidate the Next.js app over HTTP.
  const server = createServer({ revalidateTags, localFiles: false });
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

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "GET" && METADATA_PATHS.has(pathname)) {
      return Response.json(protectedResourceMetadata);
    }

    if (request.method === "GET" && pathname === "/health") {
      return Response.json({ status: "ok", service: "mcp-blog" });
    }

    if (pathname !== "/mcp") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (request.method === "POST") {
      return handlePost(request);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { Allow: ALLOW } });
    }

    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: ALLOW } },
    );
  },
};
