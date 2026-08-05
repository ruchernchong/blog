import type { EffortLevelCount } from "@workspace/usage/types";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Daily session-level effort aggregates per coding agent.
 *
 * One row per (date, agent). Counts are **sessions**, not requests or tokens —
 * each session contributes its dominant effort level (ties → `mixed`). Levels
 * are open-ended strings (`minimal` | `low` | `medium` | `high` | `xhigh` |
 * `max` | `ultra` | `mixed` | future).
 *
 * `levels` mirrors AgentUsage's nested day payload 1:1 as typed jsonb rather
 * than normalised per-level rows. Produced by AgentUsage via
 * `POST /api/usage/ingest` (`effortRows`); the public `/usage` page folds these
 * into an all-time `EffortSummary`.
 *
 * `updatedAt` records when the ingest ran (not when usage happened).
 */
export const tokenEffortUsage = pgTable(
  "token_effort_usage",
  {
    date: date().notNull(),
    agent: text().notNull(),
    levels: jsonb().$type<EffortLevelCount[]>().notNull(),
    classifiedSessionCount: integer().notNull().default(0),
    unclassifiedSessionCount: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.date, table.agent],
    }),
    index().on(table.date),
    index().on(table.agent),
  ],
);

export type InsertTokenEffortUsage = typeof tokenEffortUsage.$inferInsert;
export type SelectTokenEffortUsage = typeof tokenEffortUsage.$inferSelect;
