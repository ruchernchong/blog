import { sql } from "drizzle-orm";
import { excludedColumns } from "@/lib/queries/upsert";
import type { ModelEntry } from "@/lib/usage/registry";
import { db, type InsertModel, model, type SelectModel } from "@/schema";

/** Postgres caps bound parameters per statement; chunk large upserts under it. */
const UPSERT_CHUNK_SIZE = 1000;

/** Columns refreshed from the incoming row on conflict (everything but the key). */
const UPDATE_COLUMNS = [
  "displayName",
  "inputRate",
  "outputRate",
  "cacheReadRate",
  "cacheWriteRate",
  "contextLimit",
  "releaseDate",
  "source",
  "isOverride",
  "aliasTarget",
] as const satisfies (keyof InsertModel)[];

const rate = (value?: number): string | null =>
  value == null ? null : value.toFixed(6);

/** Accept only a well-formed calendar date; upstream sources occasionally
 * carry malformed values (e.g. `2025-25-11`) that Postgres `date` rejects. */
function validDate(value?: string): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

/**
 * Upsert value for `open_weights`: an incoming NULL means "unknown" (models.dev
 * unavailable, or an override that did not set it), so keep the stored flag.
 */
export const keepOpenWeights = sql`coalesce(excluded.open_weights, ${model.openWeights})`;

/** A merged {@link ModelEntry} → a `model` table insert row. */
export function entryToRow(entry: ModelEntry): InsertModel {
  return {
    provider: entry.provider,
    id: entry.id,
    displayName: entry.displayName ?? null,
    inputRate: rate(entry.rate?.input),
    outputRate: rate(entry.rate?.output),
    cacheReadRate: rate(entry.rate?.cacheRead),
    cacheWriteRate: rate(entry.rate?.cacheWrite),
    contextLimit: entry.contextLimit ?? null,
    releaseDate: validDate(entry.releaseDate),
    openWeights: entry.openWeights ?? null,
    source: entry.source,
    isOverride: entry.isOverride ?? false,
    aliasTarget: entry.aliasTarget ?? null,
  };
}

/**
 * Narrow `model` projection used to build pricing: identity, the four rates,
 * and `aliasTarget`. Metadata (name, source, dates) is unused by `costOf`.
 */
export const MODEL_PRICING_COLUMNS = {
  provider: model.provider,
  id: model.id,
  inputRate: model.inputRate,
  outputRate: model.outputRate,
  cacheReadRate: model.cacheReadRate,
  cacheWriteRate: model.cacheWriteRate,
  aliasTarget: model.aliasTarget,
} as const;

export type ModelPricingRow = {
  provider: string;
  id: string;
  inputRate: string | null;
  outputRate: string | null;
  cacheReadRate: string | null;
  cacheWriteRate: string | null;
  aliasTarget: string | null;
};

/** Pricing columns → a {@link ModelEntry} `costOf` can consume. */
export function pricingRowToEntry(row: ModelPricingRow): ModelEntry {
  const num = (value: string | null): number | undefined =>
    value == null ? undefined : Number(value);
  const input = num(row.inputRate);
  const output = num(row.outputRate);
  return {
    provider: row.provider,
    id: row.id,
    rate:
      input != null || output != null
        ? {
            input,
            output,
            cacheRead: num(row.cacheReadRate),
            cacheWrite: num(row.cacheWriteRate),
          }
        : undefined,
    // `costOf` ignores source; a placeholder keeps {@link ModelEntry} satisfied.
    source: "override",
    aliasTarget: row.aliasTarget ?? undefined,
  };
}

/** A `model` table row → a {@link ModelEntry} for merging/pricing. */
export function rowToEntry(row: SelectModel): ModelEntry {
  return {
    ...pricingRowToEntry(row),
    displayName: row.displayName ?? undefined,
    contextLimit: row.contextLimit ?? undefined,
    releaseDate: row.releaseDate ?? undefined,
    openWeights: row.openWeights ?? undefined,
    source: row.source,
    isOverride: row.isOverride,
  };
}

/**
 * Upsert the merged model registry on the composite key (provider, id).
 *
 * Unlike `token_usage` (a lifetime-cumulative record with a non-decreasing
 * ratchet), the registry is a live snapshot of current pricing/metadata, so the
 * update on conflict is unconditional. The full merged set is written by a
 * single deterministic writer; curated rows are re-derived each run from
 * `isOverride` DB rows folded back through the merge, so re-upserting them
 * preserves their curated fields. Returns the number of rows submitted.
 */
export async function upsertModelRegistry(
  entries: ModelEntry[],
): Promise<number> {
  if (entries.length === 0) return 0;
  const rows = entries.map(entryToRow);
  const set = {
    ...excludedColumns(model, UPDATE_COLUMNS),
    openWeights: keepOpenWeights,
    updatedAt: sql`now()`,
  };
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    await db
      .insert(model)
      .values(chunk)
      .onConflictDoUpdate({ target: [model.provider, model.id], set });
  }
  return rows.length;
}
