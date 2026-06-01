import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

function getCliOption(name: string): string | undefined {
  const flag = `--${name}`;
  const inlineFlag = `${flag}=`;

  for (const [index, arg] of process.argv.entries()) {
    if (arg === flag) {
      return process.argv[index + 1];
    }

    if (arg.startsWith(inlineFlag)) {
      return arg.slice(inlineFlag.length);
    }
  }
}

const stage =
  getCliOption("stage") ??
  process.env.ALCHEMY_STAGE ??
  process.env.USER ??
  "dev";
const isProduction = stage === "production";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function stageEnv(name: string, fallback?: string): string {
  if (isProduction) {
    return requiredEnv(name);
  }

  return process.env[name] || fallback || requiredEnv(name);
}

function secretBinding(name: string, fallback?: string) {
  const value = stageEnv(name, fallback);

  return isProduction ? alchemy.secret(value) : value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value || undefined;
}

const app = await alchemy("blog-mcp", {
  stage,
  ...(isProduction
    ? {
        password: requiredEnv("ALCHEMY_PASSWORD"),
        stateStore: (scope) => new CloudflareStateStore(scope),
      }
    : {}),
});

const worker = await Worker("blog-mcp", {
  name: isProduction ? "blog-mcp" : `blog-mcp-${stage}`,
  entrypoint: "./src/mcp/worker.ts",
  compatibility: "node",
  compatibilityDate: "2026-04-24",
  observability: {
    enabled: true,
  },
  ...(isProduction
    ? {
        domains: [
          {
            domainName: "mcp.ruchern.dev",
            adopt: true,
          },
        ],
      }
    : {}),
  bindings: {
    DATABASE_URL: secretBinding("DATABASE_URL"),
    UPSTASH_REDIS_REST_URL: stageEnv("UPSTASH_REDIS_REST_URL"),
    UPSTASH_REDIS_REST_TOKEN: secretBinding("UPSTASH_REDIS_REST_TOKEN"),
    BLOG_MCP_AUTH_TOKEN: secretBinding(
      "BLOG_MCP_AUTH_TOKEN",
      "development-mcp-token",
    ),
    CLOUDFLARE_ACCOUNT_ID: stageEnv("CLOUDFLARE_ACCOUNT_ID"),
    R2_ACCESS_KEY_ID: secretBinding("R2_ACCESS_KEY_ID"),
    R2_SECRET_ACCESS_KEY: secretBinding("R2_SECRET_ACCESS_KEY"),
    R2_BUCKET_NAME: stageEnv("R2_BUCKET_NAME"),
    R2_PUBLIC_URL: stageEnv("R2_PUBLIC_URL"),
    NEXT_PUBLIC_BASE_URL: stageEnv(
      "NEXT_PUBLIC_BASE_URL",
      "http://localhost:3000",
    ),
    MCP_REVALIDATE_SECRET: secretBinding(
      "MCP_REVALIDATE_SECRET",
      "development-revalidate-secret",
    ),
    ...(optionalEnv("MCP_REVALIDATE_URL")
      ? { MCP_REVALIDATE_URL: optionalEnv("MCP_REVALIDATE_URL") }
      : {}),
  },
});

console.log(`Worker deployed at: ${worker.url}`);

await app.finalize();
