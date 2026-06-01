export interface BlogMcpWorkerEnv {
  DATABASE_URL?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  BLOG_MCP_AUTH_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  R2_PUBLIC_URL?: string;
  NEXT_PUBLIC_BASE_URL?: string;
  MCP_REVALIDATE_SECRET?: string;
  MCP_REVALIDATE_URL?: string;
}

const ENV_KEYS = [
  "DATABASE_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "BLOG_MCP_AUTH_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "NEXT_PUBLIC_BASE_URL",
  "MCP_REVALIDATE_SECRET",
  "MCP_REVALIDATE_URL",
] as const;

function bindWorkerEnv(env: BlogMcpWorkerEnv): void {
  const globalWithProcess = globalThis as typeof globalThis & {
    process?: { env: Record<string, string | undefined> };
  };

  globalWithProcess.process ??= { env: {} };

  for (const key of ENV_KEYS) {
    if (env[key] !== undefined) {
      globalWithProcess.process.env[key] = env[key];
    }
  }
}

export default {
  async fetch(request: Request, env: BlogMcpWorkerEnv): Promise<Response> {
    bindWorkerEnv(env);

    const [
      { handleMcpHttpRequest, validateBearerTokenAuth },
      { unsupportedUploadFromPathHandler },
      { createWorkerPostToolServices },
    ] = await Promise.all([
      import("@/mcp/http"),
      import("@/mcp/tools/media.tools"),
      import("@/mcp/worker-services"),
    ]);

    return handleMcpHttpRequest(request, {
      authenticate: (incomingRequest) =>
        validateBearerTokenAuth(incomingRequest, env.BLOG_MCP_AUTH_TOKEN),
      server: {
        posts: {
          services: createWorkerPostToolServices(),
        },
        media: {
          uploadFromPathHandler: unsupportedUploadFromPathHandler,
        },
      },
    });
  },
};
