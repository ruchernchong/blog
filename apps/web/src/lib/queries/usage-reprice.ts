import {
  buildPricingFromRegistry,
  type Pricing,
} from "@workspace/usage/pricing";
import type { TokenBreakdown } from "@workspace/usage/types";
import { and, eq, isNull, sql } from "drizzle-orm";
import { rowToEntry } from "@/lib/queries/model-registry";
import { db, model, tokenUsage } from "@/schema";

// Kept out of usage.ts and models.ts (which import `next/cache`) so the MCP
// override tools can reprice usage without Next.js.

/**
 * Build {@link Pricing} from the persisted `model` registry.
 *
 * The registry is the merged snapshot written by `syncModelRegistry` at most
 * once per 24 hours after an ingest. It is also the last-good fallback when a
 * live source fetch fails. Used by the reprice pass and the prod ingest route.
 */
export async function loadPricing(): Promise<Pricing> {
  const rows = await db.select().from(model);
  return buildPricingFromRegistry(rows.map(rowToEntry));
}

export interface RepriceResult {
  /** Rows that were `NULL`-cost going in. */
  scanned: number;
  /** Rows that now resolve to a price and were updated. */
  repriced: number;
  /** Rows still unpriceable (e.g. legacy `unknown`, or a model no pricing DB lists). */
  stillUnpriced: number;
}

/**
 * Recompute cost for every `NULL`-cost row from its *stored* token columns using
 * current pricing, and persist the ones that now resolve.
 *
 * A row's cost is `NULL` when the model had no price at ingest time (models.dev
 * had not yet listed it). The ingest upsert self-heals such a row on the next
 * run — but only while its source log still exists; once the log is pruned the
 * parser stops regenerating that (date, agent, provider, model) key, leaving a
 * permanently stale-`NULL` orphan that re-ingesting can never reach. This pass
 * is log-independent: it reprices straight from the persisted aggregate, so an
 * orphan heals as soon as pricing catches up. Run after each ingest.
 */
export async function repriceUnpricedTokenUsage(
  pricing: Pricing,
): Promise<RepriceResult> {
  const rows = await db
    .select()
    .from(tokenUsage)
    .where(isNull(tokenUsage.costUsd));

  let repriced = 0;
  let stillUnpriced = 0;
  for (const row of rows) {
    const cost = pricing.costOf(tokensOf(row), row.model, {
      agent: row.agent,
      provider: row.provider,
    });
    if (cost === null) {
      stillUnpriced++;
      continue;
    }
    // `costUsd IS NULL` guards against a concurrent ingest that upserted this
    // same key (with fresh tokens + a real cost) between the select above and
    // this write — without it, we'd clobber the newer cost with one computed
    // from now-stale token counts. The narrowed WHERE makes the write a no-op
    // in that race instead of a silent overwrite.
    const updated = await db
      .update(tokenUsage)
      .set({ costUsd: cost.toFixed(6) })
      .where(
        and(
          eq(tokenUsage.date, row.date),
          eq(tokenUsage.agent, row.agent),
          eq(tokenUsage.provider, row.provider),
          eq(tokenUsage.model, row.model),
          sql`${tokenUsage.device} is not distinct from ${row.device}`,
          isNull(tokenUsage.costUsd),
        ),
      )
      .returning({ date: tokenUsage.date });
    if (updated.length > 0) {
      repriced++;
    }
  }

  return { scanned: rows.length, repriced, stillUnpriced };
}

/**
 * After a curated override changes, heal any `N.A.` (cost-`NULL`) `token_usage`
 * rows against the new pricing and hand the `/usage` tags to `revalidateTags`.
 * Best-effort: the override row is already persisted, so a failure here just
 * defers pricing to the next ingest's registry sync.
 */
export async function repriceUsage(
  revalidateTags: (tags: string[]) => void | Promise<void>,
): Promise<void> {
  try {
    await repriceUnpricedTokenUsage(await loadPricing());
    await revalidateTags(["usage", "models:providers"]);
  } catch {
    // Override persisted; the next ingest reprices from stored tokens.
  }
}

export function tokensOf(
  row: Pick<
    typeof tokenUsage.$inferSelect,
    | "inputTokens"
    | "outputTokens"
    | "cacheReadTokens"
    | "cacheWriteTokens"
    | "reasoningTokens"
  >,
): TokenBreakdown {
  return {
    input: row.inputTokens,
    output: row.outputTokens,
    cacheRead: row.cacheReadTokens,
    cacheWrite: row.cacheWriteTokens,
    reasoning: row.reasoningTokens,
  };
}
