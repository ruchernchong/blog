import { usageIngestSchema } from "@workspace/usage/ingest";
import { z } from "zod";
import { BASE_URL, VERSION } from "@/config";
import {
  MCP_SCOPE,
  OAUTH_RESOURCE,
  type protectedResourceMetadata,
} from "@/lib/api/oauth-protected-resource";

const json = (schema: object, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

const errorResponse = (description: string) =>
  json({ $ref: "#/components/schemas/Error" }, description);

const unauthorised = {
  ...errorResponse("Missing, invalid or non-admin bearer token"),
  headers: {
    "WWW-Authenticate": {
      description:
        "Bearer challenge naming the required scope and the protected-resource metadata (MCP API only)",
      schema: { type: "string" },
    },
  },
};

/**
 * OpenAPI 3.1 description of the public HTTP API. The Studio routes under
 * `/api/studio` are left out: they serve the site's own CMS over a session
 * cookie and are not meant for other clients.
 *
 * The usage ingest body is generated from the Zod schema the route validates
 * with, so the two cannot drift.
 */
const specification = {
  openapi: "3.1.0",
  info: {
    title: "ruchern.dev API",
    version: VERSION,
    description:
      "HTTP API of ruchern.dev. Write endpoints need an OAuth 2.1 access token from this site's own provider (Authorization Code with PKCE; clients self-register) that belongs to an admin account. See /llms.txt for an overview of the site.",
  },
  servers: [{ url: BASE_URL }],
  externalDocs: {
    description: "OAuth client integration guide",
    url: "https://github.com/ruchernchong/blog/blob/main/docs/oauth-provider.md",
  },
  paths: {
    "/api/usage/ingest": {
      post: {
        operationId: "ingestUsage",
        summary: "Upsert daily token-usage aggregates",
        description:
          "Upserts daily per-session token usage (and optional effort aggregates) for the public /usage page. The token must be issued for the `resource` " +
          `${OAUTH_RESOURCE} and belong to an admin account.`,
        security: [{ oauth2: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: z.toJSONSchema(usageIngestSchema, { io: "input" }),
            },
          },
        },
        responses: {
          "200": json(
            {
              type: "object",
              required: ["ok", "upserted", "effortUpserted", "syncRunId"],
              properties: {
                ok: { type: "boolean" },
                upserted: { type: "integer" },
                effortUpserted: { type: "integer" },
                syncRunId: {
                  type: ["string", "null"],
                  description:
                    "Run id of the model registry sync this request scheduled, if any",
                },
              },
            },
            "Rows upserted",
          ),
          "400": errorResponse("Invalid JSON or a body that fails validation"),
          "401": unauthorised,
          "500": errorResponse("The upsert failed"),
          "503": errorResponse("The database is unavailable"),
        },
      },
    },
    "/api/mcp": {
      post: {
        operationId: "mcp",
        summary: "Model Context Protocol endpoint (Streamable HTTP, stateless)",
        description:
          "Accepts MCP JSON-RPC messages for managing posts, media and the model registry. Tools are discovered with the MCP `tools/list` method. The token must carry the `mcp` scope, be issued for the `resource` " +
          `${BASE_URL}/api/mcp and belong to an admin account.`,
        security: [{ oauth2: [MCP_SCOPE] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "A JSON-RPC 2.0 message",
                required: ["jsonrpc"],
                properties: { jsonrpc: { const: "2.0" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "JSON-RPC response",
            content: {
              "application/json": { schema: { type: "object" } },
              "text/event-stream": { schema: { type: "string" } },
            },
          },
          "401": unauthorised,
          "403": errorResponse(
            "The token lacks the `mcp` scope, or the user is not an admin",
          ),
        },
      },
    },
    "/api/mcp/health": {
      get: {
        operationId: "mcpHealth",
        summary: "MCP server health check",
        security: [],
        responses: {
          "200": json(
            {
              type: "object",
              required: ["status", "service"],
              properties: {
                status: { const: "ok" },
                service: { const: "mcp-blog" },
              },
            },
            "The server is up",
          ),
        },
      },
    },
    "/api/revalidate": {
      post: {
        operationId: "revalidateTags",
        summary: "Invalidate cached content by tag",
        description:
          "Used by the external MCP servers after a database write. Only tags the site caches are accepted.",
        security: [{ revalidateSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tags"],
                properties: {
                  tags: {
                    type: "array",
                    minItems: 1,
                    maxItems: 100,
                    items: { type: "string", minLength: 1, maxLength: 256 },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": json(
            {
              type: "object",
              required: ["revalidated"],
              properties: {
                revalidated: { type: "array", items: { type: "string" } },
              },
            },
            "The tags that were revalidated",
          ),
          "400": errorResponse("Invalid body, or a tag that is not allowed"),
          "401": errorResponse("Missing or wrong secret"),
        },
      },
    },
    "/.well-known/oauth-authorization-server": {
      get: {
        operationId: "authorizationServerMetadata",
        summary: "OAuth 2.0 authorization server metadata (RFC 8414)",
        security: [],
        responses: {
          "200": json({ type: "object" }, "Authorization server metadata"),
        },
      },
    },
    "/.well-known/oauth-authorization-server/api/auth": {
      get: {
        operationId: "authorizationServerMetadataForIssuer",
        summary:
          "OAuth 2.0 authorization server metadata at the RFC 8414 path for the /api/auth issuer",
        security: [],
        responses: {
          "200": json({ type: "object" }, "Authorization server metadata"),
        },
      },
    },
    "/.well-known/oauth-protected-resource": {
      get: {
        operationId: "protectedResourceMetadata",
        summary: "OAuth 2.0 protected resource metadata (RFC 9728)",
        security: [],
        responses: {
          "200": json({ type: "object" }, "Protected resource metadata"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      oauth2: {
        type: "oauth2",
        description:
          "OAuth 2.1 Authorization Code flow with PKCE (S256). Register a client at " +
          `${OAUTH_RESOURCE}/oauth2/register and pass the RFC 8707 \`resource\` parameter so the access token is a JWT.`,
        flows: {
          authorizationCode: {
            authorizationUrl: `${OAUTH_RESOURCE}/oauth2/authorize`,
            tokenUrl: `${OAUTH_RESOURCE}/oauth2/token`,
            refreshUrl: `${OAUTH_RESOURCE}/oauth2/token`,
            scopes: {
              openid: "Verify the user's identity",
              profile: "Read basic profile information",
              email: "Read the user's email address",
              offline_access: "Issue a refresh token",
              [MCP_SCOPE]: "Access the MCP API",
            } satisfies Record<
              (typeof protectedResourceMetadata.scopes_supported)[number],
              string
            >,
          },
        },
      },
      revalidateSecret: {
        type: "http",
        scheme: "bearer",
        description: "The deployment's shared revalidation secret",
      },
    },
    schemas: {
      Error: {
        type: "object",
        description:
          "Every error is a JSON object carrying `error` or `message`, or both.",
        properties: {
          error: { type: "string", description: "Short error code or name" },
          message: { type: "string", description: "What went wrong" },
          hint: { type: "string", description: "How to resolve it" },
          errors: {
            type: "array",
            description: "Per-field validation failures",
            items: {
              type: "object",
              required: ["field", "message"],
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
          rejected: {
            type: "array",
            description: "Revalidation tags that are not allowed",
            items: { type: "string" },
          },
        },
      },
    },
  },
};

export function GET() {
  return Response.json(specification);
}
