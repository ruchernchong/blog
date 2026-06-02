import "dotenv/config";
import { parseAllAgents } from "@workspace/usage/parsers";
import { loadPricing } from "@workspace/usage/pricing";
import { resolveProvider } from "@workspace/usage/providers";
import type { TokenBreakdown } from "@workspace/usage/types";
import { format } from "date-fns";
import { upsertTokenUsage } from "@/lib/queries/usage";
import type { InsertTokenUsage } from "@/schema";

/**
 * Parse local agent logs, price them via models.dev, fold to per-(date, agent,
 * provider, model) daily aggregates, and upsert into `token_usage`.
 *
 * Parsing only ever happens locally (the agent logs live on this machine), but
 * the upsert can target two places:
 *   - `pnpm usage:ingest` — writes directly to `DATABASE_URL` (the local dev
 *     branch) via Drizzle.
 *   - `pnpm usage:ingest:prod` — POSTs the rows to the deployed
 *     `/api/usage/ingest` route, which upserts them with the *deployment's* own
 *     `DATABASE_URL` (production). The prod connection string never touches this
 *     machine; only the existing `BLOG_MCP_AUTH_TOKEN` bearer is sent. The route
 *     host comes from Vercel's deployment env (see `resolveRemoteEndpoint`).
 *
 * Idempotent: re-running recomputes from the logs (the source of truth) and
 * upserts on the composite primary key. Days are bucketed in the machine's local
 * timezone (Singapore), which is correct because ingest only runs locally.
 */

interface Aggregate {
  date: string;
  agent: string;
  provider: string;
  model: string;
  tokens: TokenBreakdown;
  messages: number;
}

function emptyTokens(): TokenBreakdown {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 };
}

/** Parse, price, and fold the local agent logs into daily `token_usage` rows. */
async function buildRows(): Promise<InsertTokenUsage[]> {
  console.log("Parsing agent logs …");
  const { agents, events } = await parseAllAgents();
  console.log(`  agents: ${agents.join(", ") || "(none found)"}`);
  console.log(`  events: ${events.length.toLocaleString()}`);

  if (events.length === 0) return [];

  console.log("Fetching model pricing from models.dev …");
  const pricing = await loadPricing();

  // Fold events into per-(date, agent, provider, model) aggregates.
  const groups = new Map<string, Aggregate>();
  for (const event of events) {
    const parsed = new Date(event.ts);
    if (Number.isNaN(parsed.getTime())) continue;
    const date = format(parsed, "yyyy-MM-dd");

    const provider = resolveProvider(event);
    const key = `${date}|${event.agent}|${provider}|${event.model}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        date,
        agent: event.agent,
        provider,
        model: event.model,
        tokens: emptyTokens(),
        messages: 0,
      };
      groups.set(key, group);
    }
    group.tokens.input += event.tokens.input;
    group.tokens.output += event.tokens.output;
    group.tokens.cacheRead += event.tokens.cacheRead;
    group.tokens.cacheWrite += event.tokens.cacheWrite;
    group.tokens.reasoning += event.tokens.reasoning;
    group.messages += 1;
  }

  return [...groups.values()].map((group) => {
    const totalTokens =
      group.tokens.input +
      group.tokens.output +
      group.tokens.cacheRead +
      group.tokens.cacheWrite +
      group.tokens.reasoning;
    const cost = pricing.costOf(group.tokens, group.model, {
      agent: group.agent,
      provider: group.provider,
    });
    return {
      date: group.date,
      agent: group.agent,
      provider: group.provider,
      model: group.model,
      inputTokens: group.tokens.input,
      outputTokens: group.tokens.output,
      cacheReadTokens: group.tokens.cacheRead,
      cacheWriteTokens: group.tokens.cacheWrite,
      reasoningTokens: group.tokens.reasoning,
      totalTokens,
      // null = model could not be priced (rendered "N.A."), not a genuine $0.
      costUsd: cost?.toFixed(6) ?? null,
      messages: group.messages,
    };
  });
}

/**
 * Resolve the deployed ingest endpoint from Vercel's deployment env vars.
 *
 * Prefer `VERCEL_PROJECT_PRODUCTION_URL`: per Vercel's docs it is the project's
 * production domain (the shortest custom domain, e.g. `ruchern.dev`), is always
 * set, and is the recommended way to reliably link to production. Fall back to
 * `VERCEL_URL` (the ephemeral per-deployment `*.vercel.app` host) for runs from
 * inside a preview/CI deployment. Neither includes the protocol scheme, so
 * `https://` is prepended. Both are injected on Vercel at build/runtime, so a
 * local run must have them pulled (`vercel env pull`) or exported first.
 */
function resolveRemoteEndpoint(): string {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (!host) {
    throw new Error(
      "VERCEL_PROJECT_PRODUCTION_URL (or VERCEL_URL) must be set to ingest to " +
        "production. Run `vercel env pull` or export it before the run.",
    );
  }
  const base = host.startsWith("http") ? host : `https://${host}`;
  return `${base}/api/usage/ingest`;
}

/** POST rows to the deployed `/api/usage/ingest` route (writes prod-side). */
async function postRows(endpoint: string, rows: InsertTokenUsage[]) {
  const token = process.env.BLOG_MCP_AUTH_TOKEN;
  if (!token) {
    throw new Error(
      "BLOG_MCP_AUTH_TOKEN is required to ingest to the deployed endpoint.",
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rows }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ingest endpoint ${response.status}: ${detail}`);
  }
}

function printSummary(rows: InsertTokenUsage[]) {
  const totalTokens = rows.reduce(
    (sum, row) => sum + (row.totalTokens ?? 0),
    0,
  );
  const totalCost = rows.reduce(
    (sum, row) => sum + (row.costUsd === null ? 0 : Number(row.costUsd)),
    0,
  );
  const naRows = rows.filter((row) => row.costUsd === null).length;
  const dates = rows.map((row) => row.date).sort();
  console.log("\nDone.");
  console.log(`  rows:    ${rows.length.toLocaleString()}`);
  console.log(`  days:    ${new Set(dates).size.toLocaleString()}`);
  console.log(`  range:   ${dates[0]} → ${dates[dates.length - 1]}`);
  console.log(`  tokens:  ${totalTokens.toLocaleString()}`);
  console.log(`  cost:    $${totalCost.toFixed(2)}`);
  if (naRows > 0) {
    console.log(`  N.A.:    ${naRows.toLocaleString()} rows (model unpriced)`);
  }
}

async function main() {
  const rows = await buildRows();
  if (rows.length === 0) {
    console.log("Nothing to ingest.");
    process.exit(0);
  }

  // `usage:ingest:prod` sets this; the default local run leaves it unset so the
  // direct DATABASE_URL write can never accidentally target production.
  const toProduction = process.env.USAGE_INGEST_TARGET === "prod";
  if (toProduction) {
    const endpoint = resolveRemoteEndpoint();
    console.log(`Upserting ${rows.length.toLocaleString()} rows → ${endpoint}`);
    await postRows(endpoint, rows);
  } else {
    console.log(
      `Upserting ${rows.length.toLocaleString()} rows → DATABASE_URL`,
    );
    await upsertTokenUsage(rows);
  }

  printSummary(rows);
  process.exit(0);
}

main().catch((error) => {
  console.error("Ingest failed:", error);
  process.exit(1);
});
