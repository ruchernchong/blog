import {
  bigint,
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
 * Daily token-usage aggregates per coding agent + model.
 *
 * `agent` is the coding tool that produced the logs (e.g. "claude", "codex");
 * `provider` is the inference vendor that billed the tokens (e.g. "anthropic",
 * "openai"), derived from the agent at ingest. Provider is functionally
 * determined by agent today, so it is denormalised onto each row (queryable for
 * per-vendor rollups) but kept out of the primary key.
 *
 * One row per (date, agent, model) — daily is the finest grain by design. Only the
 * calendar `date` is stored, never a time-of-day, so the data cannot reveal *when*
 * within a day work happened. The local `usage:ingest` script parses agent logs,
 * prices them, folds to these aggregates, and upserts on the composite key
 * (idempotent re-ingest). The public `/usage` page only ever reads these rows.
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
export const tokenUsage = pgTable(
  "token_usage",
  {
    date: date().notNull(),
    agent: text().notNull(),
    provider: text().notNull().default("unknown"),
    model: text().notNull(),
    inputTokens: bigint({ mode: "number" }).notNull().default(0),
    outputTokens: bigint({ mode: "number" }).notNull().default(0),
    cacheReadTokens: bigint({ mode: "number" }).notNull().default(0),
    cacheWriteTokens: bigint({ mode: "number" }).notNull().default(0),
    reasoningTokens: bigint({ mode: "number" }).notNull().default(0),
    totalTokens: bigint({ mode: "number" }).notNull().default(0),
    costUsd: numeric({ precision: 14, scale: 6 }),
    messages: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.date, table.agent, table.model] }),
    index().on(table.date),
    index().on(table.agent),
    index().on(table.provider),
    index().on(table.model),
  ],
);

export type InsertTokenUsage = typeof tokenUsage.$inferInsert;
export type SelectTokenUsage = typeof tokenUsage.$inferSelect;
