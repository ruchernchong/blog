import "dotenv/config";
import { format } from "date-fns";
import { sql } from "drizzle-orm";
import { parseAllAgents } from "@/lib/usage/parsers";
import { loadPricing } from "@/lib/usage/pricing";
import type { TokenBreakdown } from "@/lib/usage/types";
import { db, tokenUsage } from "@/schema";

/**
 * Parse local agent logs, price them via models.dev, fold to per-(date, agent,
 * model) daily aggregates, and upsert into `token_usage`. Run `pnpm usage:ingest`.
 *
 * Idempotent: re-running recomputes from the logs (the source of truth) and
 * upserts on the composite primary key. Days are bucketed in the machine's local
 * timezone (Singapore), which is correct because ingest only runs locally.
 */

const CHUNK_SIZE = 1000;

interface Aggregate {
  date: string;
  agent: string;
  model: string;
  tokens: TokenBreakdown;
  messages: number;
}

function emptyTokens(): TokenBreakdown {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 };
}

async function main() {
  console.log("Parsing agent logs …");
  const { agents, events } = await parseAllAgents();
  console.log(`  agents: ${agents.join(", ") || "(none found)"}`);
  console.log(`  events: ${events.length.toLocaleString()}`);

  if (events.length === 0) {
    console.log("Nothing to ingest.");
    process.exit(0);
  }

  console.log("Fetching model pricing from models.dev …");
  const pricing = await loadPricing();

  // Fold events into per-(date, agent, model) aggregates.
  const groups = new Map<string, Aggregate>();
  for (const event of events) {
    const parsed = new Date(event.ts);
    if (Number.isNaN(parsed.getTime())) continue;
    const date = format(parsed, "yyyy-MM-dd");

    const key = `${date}|${event.agent}|${event.model}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        date,
        agent: event.agent,
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

  const rows = [...groups.values()].map((group) => {
    const totalTokens =
      group.tokens.input +
      group.tokens.output +
      group.tokens.cacheRead +
      group.tokens.cacheWrite +
      group.tokens.reasoning;
    const cost = pricing.costOf(group.tokens, group.model, group.agent);
    return {
      date: group.date,
      agent: group.agent,
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

  console.log(`Upserting ${rows.length.toLocaleString()} daily rows …`);
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db
      .insert(tokenUsage)
      .values(chunk)
      .onConflictDoUpdate({
        target: [tokenUsage.date, tokenUsage.agent, tokenUsage.model],
        set: {
          inputTokens: sql`excluded.input_tokens`,
          outputTokens: sql`excluded.output_tokens`,
          cacheReadTokens: sql`excluded.cache_read_tokens`,
          cacheWriteTokens: sql`excluded.cache_write_tokens`,
          reasoningTokens: sql`excluded.reasoning_tokens`,
          totalTokens: sql`excluded.total_tokens`,
          costUsd: sql`excluded.cost_usd`,
          messages: sql`excluded.messages`,
          updatedAt: sql`now()`,
        },
      });
  }

  // Summary.
  const totalTokens = rows.reduce((sum, row) => sum + row.totalTokens, 0);
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
  process.exit(0);
}

main().catch((error) => {
  console.error("Ingest failed:", error);
  process.exit(1);
});
