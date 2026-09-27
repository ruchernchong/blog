import {
  bigint,
  date,
  index,
  integer,
  numeric,
  snakeCase,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Daily token-usage aggregates per coding agent + model.
 *
 * `agent` is the coding tool that produced the logs (e.g. "claude", "codex",
 * "opencode"); `provider` is the inference vendor that billed the tokens (e.g.
 * "anthropic", "openai", "fireworks-ai"). For single-provider agents it is
 * derived from the agent; multi-provider agents (OpenCode) record it per message.
 * Provider is part of the key because one model can run under several
 * providers (e.g. "gpt-5.5" via both "openai" and "opencode").
 *
 * `device` is the collector install that sent the row. `session` is a hash of
 * the agent's session id, so a day holds one row per session. Migration
 * Assistant copies session logs verbatim, so a copied session arrives from two
 * devices under the same hash; the read keeps the larger copy instead of adding
 * them, while different sessions (on any Mac) still add up. Both are `null` for
 * clients that send none; those legacy daily rows are reconciled against the
 * session rows on read. The key is a `NULLS NOT DISTINCT` unique constraint
 * rather than a primary key (which cannot hold `null`), so those rows still
 * collide on re-ingest and the upsert stays idempotent.
 *
 * One row per (date, agent, provider, model, device, session) — daily is the
 * finest time grain by design. Only the
 * calendar `date` is stored, never a time-of-day, so the data cannot reveal *when*
 * within a day work happened. The Rust collector (`pnpm usage:ingest`) parses
 * agent logs, folds them to these aggregates, and POSTs them to
 * `/api/usage/ingest`, which upserts on the composite key (idempotent
 * re-ingest) and prices them. The public `/usage` page only ever reads these rows.
 *
 * `updatedAt` records when the ingest ran (not when usage happened).
 *
 * Token columns are `bigint` (mode: number) because a single heavy day's
 * cache-read total can exceed the 2.1B `integer` ceiling.
 *
 * `costUsd` is nullable: `null` means the model could not be priced (e.g. legacy
 * Codex sessions that recorded no model), rendered as "N.A." — distinct from a
 * genuine `0`. We never fabricate a cost for an unidentifiable model.
 */
export const tokenUsage = snakeCase.table(
  "token_usage",
  {
    date: date().notNull(),
    agent: text().notNull(),
    provider: text().notNull().default("unknown"),
    model: text().notNull(),
    device: text(),
    session: text(),
    inputTokens: bigint({ mode: "number" }).notNull().default(0),
    outputTokens: bigint({ mode: "number" }).notNull().default(0),
    cacheReadTokens: bigint({ mode: "number" }).notNull().default(0),
    cacheWriteTokens: bigint({ mode: "number" }).notNull().default(0),
    reasoningTokens: bigint({ mode: "number" }).notNull().default(0),
    totalTokens: bigint({ mode: "number" }).notNull().default(0),
    costUsd: numeric({ precision: 14, scale: 6 }),
    messages: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique()
      .on(
        table.date,
        table.agent,
        table.provider,
        table.model,
        table.device,
        table.session,
      )
      .nullsNotDistinct(),
    index().on(table.date),
    index().on(table.agent),
    index().on(table.provider),
    index().on(table.model),
  ],
);

export type InsertTokenUsage = typeof tokenUsage.$inferInsert;
export type SelectTokenUsage = typeof tokenUsage.$inferSelect;
