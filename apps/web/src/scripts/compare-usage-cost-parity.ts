import "dotenv/config";
import {
  MODEL_PRICING_COLUMNS,
  pricingRowToEntry,
} from "@/lib/queries/model-registry";
import { buildPricingFromRegistry } from "@/lib/usage/pricing";
import { db, model, tokenUsage } from "@/schema";

/**
 * Throwaway parity check for #343: stored `token_usage.costUsd` vs
 * `costOf(stored tokens, current registry)` after `toFixed(6)`.
 *
 * Not wired into CI. Run locally:
 *   pnpm --filter @workspace/web usage:compare-cost
 *
 * Refuses `NODE_ENV=production`. Do not point DATABASE_URL at production.
 */

type Class =
  | "match"
  | "numeric_delta"
  | "stored_null_derived_priced"
  | "stored_priced_derived_null"
  | "both_null";

const CLASSES: Class[] = [
  "match",
  "numeric_delta",
  "stored_null_derived_priced",
  "stored_priced_derived_null",
  "both_null",
];

interface ProviderTotals {
  rows: number;
  stored: number;
  derived: number;
  classes: Record<Class, number>;
}

function emptyClasses(): Record<Class, number> {
  return {
    match: 0,
    numeric_delta: 0,
    stored_null_derived_priced: 0,
    stored_priced_derived_null: 0,
    both_null: 0,
  };
}

function classify(stored: string | null, derivedFixed: string | null): Class {
  if (stored === null && derivedFixed === null) return "both_null";
  if (stored === null) return "stored_null_derived_priced";
  if (derivedFixed === null) return "stored_priced_derived_null";
  if (stored === derivedFixed) return "match";
  return "numeric_delta";
}

function fmtUsd(value: number): string {
  return value.toFixed(6);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to run against NODE_ENV=production.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (
    ["vercel", "/production", "/prod"].some((marker) =>
      databaseUrl.toLowerCase().includes(marker),
    )
  ) {
    console.error("Refusing to run: DATABASE_URL looks like production.");
    process.exit(1);
  }

  const [usageRows, modelRows] = await db.batch([
    db.select().from(tokenUsage),
    db.select(MODEL_PRICING_COLUMNS).from(model),
  ]);
  const pricing = buildPricingFromRegistry(modelRows.map(pricingRowToEntry));

  const overall = emptyClasses();
  const byProvider = new Map<string, ProviderTotals>();
  let storedTotal = 0;
  let derivedTotal = 0;

  for (const row of usageRows) {
    const derived = pricing.costOf(
      {
        input: row.inputTokens,
        output: row.outputTokens,
        cacheRead: row.cacheReadTokens,
        cacheWrite: row.cacheWriteTokens,
        reasoning: row.reasoningTokens,
      },
      row.model,
      { agent: row.agent, provider: row.provider },
    );
    const derivedFixed = derived === null ? null : derived.toFixed(6);
    const klass = classify(row.costUsd, derivedFixed);
    overall[klass]++;

    let provider = byProvider.get(row.provider);
    if (!provider) {
      provider = {
        rows: 0,
        stored: 0,
        derived: 0,
        classes: emptyClasses(),
      };
      byProvider.set(row.provider, provider);
    }
    provider.rows++;
    provider.classes[klass]++;
    if (row.costUsd !== null) {
      const stored = Number(row.costUsd);
      provider.stored += stored;
      storedTotal += stored;
    }
    if (derived !== null) {
      provider.derived += derived;
      derivedTotal += derived;
    }
  }

  console.log(`rows=${usageRows.length} registry=${modelRows.length}`);
  console.log("classes:");
  for (const klass of CLASSES) {
    console.log(`  ${klass}: ${overall[klass]}`);
  }
  console.log(
    `totals: stored=${fmtUsd(storedTotal)} derived=${fmtUsd(derivedTotal)}`,
  );
  console.log("per-provider:");
  for (const name of [...byProvider.keys()].sort((a, b) =>
    a.localeCompare(b),
  )) {
    const provider = byProvider.get(name);
    if (!provider) continue;
    const classCounts = CLASSES.map(
      (klass) => `${klass}=${provider.classes[klass]}`,
    ).join(" ");
    console.log(
      `  ${name}: rows=${provider.rows} stored=${fmtUsd(provider.stored)} derived=${fmtUsd(provider.derived)} ${classCounts}`,
    );
  }
}

try {
  await main();
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}
