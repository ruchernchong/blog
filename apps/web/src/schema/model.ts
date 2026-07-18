import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Merged model registry: pricing + display metadata per (provider, model).
 *
 * Populated on each local `pnpm usage:ingest` by `syncModelRegistry`, which
 * fetches LiteLLM (primary rates) and models.dev (display names, release dates,
 * and rate gap-fill), folds in human `isOverride` rows, and upserts the merged
 * result here. `token_usage` pricing is then built from these rows rather than
 * from hardcoded constants, so a newly-released model prices automatically once
 * either live source lists it — and a manual fix is an `isOverride` row (edited
 * via the MCP tools), never a code change + deploy.
 *
 * The composite primary key `(provider, id)` mirrors the `(provider, model)`
 * lookup used everywhere (`priceFor`, the `token_usage` key): one row per
 * priceable identity, so the ingest upsert is a natural `onConflictDoUpdate`.
 *
 * Rate columns are USD per 1,000,000 tokens (`numeric` to match `costUsd` and
 * avoid float drift) and nullable so an alias-only or name-only row can omit
 * them. `aliasTarget`, when set, means price/label resolve from
 * `(provider, aliasTarget)` instead (e.g. Codex's `codex-auto-review`).
 */
export const model = pgTable(
  "model",
  {
    provider: text().notNull(),
    id: text().notNull(),
    displayName: text(),
    inputRate: numeric({ precision: 14, scale: 6 }),
    outputRate: numeric({ precision: 14, scale: 6 }),
    cacheReadRate: numeric({ precision: 14, scale: 6 }),
    cacheWriteRate: numeric({ precision: 14, scale: 6 }),
    contextLimit: integer(),
    releaseDate: date(),
    source: text({
      enum: ["models.dev", "litellm", "openrouter", "override"],
    }).notNull(),
    isOverride: boolean().notNull().default(false),
    aliasTarget: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.id] }),
    // Bare-slug lookup for the cross-provider global pricing fallback.
    index().on(table.id),
  ],
);

export type InsertModel = typeof model.$inferInsert;
export type SelectModel = typeof model.$inferSelect;
