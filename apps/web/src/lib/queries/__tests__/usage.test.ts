import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Capture the config handed to `onConflictDoUpdate` so we can assert the upsert
 * stays non-decreasing. We keep the real schema (so `tokenUsage` columns
 * serialize to their true names) and swap only `db` for a recording stub.
 */
const { onConflictConfigs } = vi.hoisted(() => ({
  onConflictConfigs: [] as Array<{
    target: unknown;
    set: Record<string, unknown>;
    setWhere?: unknown;
  }>,
}));

vi.mock("@/schema", async () => {
  const actual = await vi.importActual<typeof import("@/schema")>("@/schema");
  const db = {
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: (config: (typeof onConflictConfigs)[number]) => {
          onConflictConfigs.push(config);
          return Promise.resolve();
        },
      }),
    }),
  };
  return { ...actual, db };
});

import { upsertTokenUsage } from "../usage";

// Drizzle v1 bakes the snake_case casing into columns at table-creation time
// (via the pgTableCreator in schema/_table.ts), so the column names serialize
// to their real snake_case form without configuring casing on the dialect.
const dialect = new PgDialect();

const baseRow = {
  date: "2026-05-30",
  agent: "claude",
  provider: "anthropic",
  model: "claude-opus-4-7",
  inputTokens: 100,
  outputTokens: 200,
  cacheReadTokens: 300,
  cacheWriteTokens: 50,
  reasoningTokens: 0,
  totalTokens: 650,
  costUsd: "1.234560",
  messages: 5,
};

describe("upsertTokenUsage", () => {
  beforeEach(() => {
    onConflictConfigs.length = 0;
  });

  it("should only overwrite a day when the incoming snapshot has more tokens", async () => {
    await upsertTokenUsage([baseRow]);

    expect(onConflictConfigs).toHaveLength(1);
    const { setWhere } = onConflictConfigs[0];
    expect(setWhere).toBeDefined();

    // The guard makes the stored lifetime total non-decreasing: a pruned-log
    // re-parse with a smaller total is ignored; a larger (more complete) parse wins.
    const { sql } = dialect.sqlToQuery(setWhere as never);
    expect(sql).toBe('excluded.total_tokens > "token_usage"."total_tokens"');
  });

  it("should point every token column at the incoming (excluded) value", async () => {
    await upsertTokenUsage([baseRow]);

    const { set } = onConflictConfigs[0];
    for (const column of [
      "inputTokens",
      "outputTokens",
      "cacheReadTokens",
      "cacheWriteTokens",
      "reasoningTokens",
      "totalTokens",
      "costUsd",
      "messages",
    ]) {
      const { sql } = dialect.sqlToQuery(set[column] as never);
      expect(sql).toBe(
        `excluded.${column.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`,
      );
    }
  });

  it("should chunk large batches under the bound-parameter cap", async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => ({
      ...baseRow,
      date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
      model: `model-${i}`,
    }));

    const submitted = await upsertTokenUsage(rows);

    // 2500 rows / 1000 per chunk = 3 statements, all carrying the same guard.
    expect(submitted).toBe(2500);
    expect(onConflictConfigs).toHaveLength(3);
    for (const config of onConflictConfigs) {
      expect(config.setWhere).toBeDefined();
    }
  });
});
