import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { revalidateTags } from "@workspace/mcp/revalidate-tags";
import { createServer } from "@workspace/mcp/server";
import { type Context, Hono } from "hono";
import { endTime, startTime, timing, wrapTime } from "hono/timing";
import {
  bearerChallenge,
  MCP_SCOPE,
  MCP_VERCEL_RESOURCE,
  PROTECTED_RESOURCE_METADATA_PATH,
  protectedResourceMetadata,
} from "@/lib/api/oauth-protected-resource";
import { type McpAuthResult, validateMcpAuth } from "./auth";

/** RFC 9728 metadata for the `/mcp` resource, suffixed with its path. */
const RESOURCE_METADATA_PATH = `${PROTECTED_RESOURCE_METADATA_PATH}/mcp`;

/**
 * The web app's document with this server's own URL as `resource`, which MCP
 * clients require to cover the server URL and then request as the audience.
 */
const vercelResourceMetadata = {
  ...protectedResourceMetadata,
  resource: MCP_VERCEL_RESOURCE,
};

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
  const metadataUrl = `${new URL(request.url).origin}${RESOURCE_METADATA_PATH}`;

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

async function handlePost(c: Context): Promise<Response> {
  const request = c.req.raw;
  const gate = await wrapTime(c, "auth", requireMcpAuth(request));
  if ("error" in gate) return gate.error;
  const { authResult } = gate;

  // Stateless mode: fresh transport + server per request, no session tracking.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  // No local filesystem, and writes revalidate the Next.js app over HTTP.
  const server = createServer({ revalidateTags, localFiles: false });

  // JSON responses are complete when handleRequest resolves, so this covers
  // the whole tool call.
  startTime(c, "mcp");
  await server.connect(transport);

  try {
    return await transport.handleRequest(request, {
      authInfo: authResult.authInfo,
    });
  } finally {
    endTime(c, "mcp");
    await server.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

const app = new Hono();

// Server-Timing on every response: auth and mcp on POST /mcp, total everywhere.
app.use(timing());
app.notFound((c) => c.json({ error: "Not found" }, 404));

// The path-suffixed document for `/mcp` and the root one, for clients that
// only try the root.
for (const path of [PROTECTED_RESOURCE_METADATA_PATH, RESOURCE_METADATA_PATH]) {
  app.get(path, (c) =>
    // No resource to publish until the project's URL is configured.
    MCP_VERCEL_RESOURCE
      ? c.json(vercelResourceMetadata)
      : c.json({ error: "Not configured" }, 503),
  );
}

app.get("/health", (c) => c.json({ status: "ok", service: "mcp-blog" }));
app.post("/mcp", handlePost);
app.options(
  "/mcp",
  () => new Response(null, { status: 204, headers: { Allow: ALLOW } }),
);
// Registered last: GET, HEAD (dispatched as GET), PUT, PATCH and DELETE.
app.all("/mcp", (c) =>
  c.json({ error: "Method not allowed" }, 405, { Allow: ALLOW }),
);

export default app;
