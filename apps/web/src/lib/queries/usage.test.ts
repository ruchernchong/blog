import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Capture the config handed to `onConflictDoUpdate` so we can assert the upsert
 * stays non-decreasing. We keep the real schema (so `tokenUsage` columns
 * serialize to their true names) and swap only `db` for a recording stub.
 */
const { onConflictConfigs, batch } = vi.hoisted(() => ({
  batch: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
  onConflictConfigs: [] as Array<{
    target: unknown;
    set: Record<string, unknown>;
    setWhere?: unknown;
  }>,
}));

vi.mock("@/schema", async () => {
  const actual = await vi.importActual<typeof import("@/schema")>("@/schema");
  const db = {
    batch,
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

import { tokenEffortUsage, tokenUsage } from "@/schema";
import {
  reconcileLegacyRows,
  upsertTokenEffortUsage,
  upsertTokenUsage,
} from "./usage";

// Tables declare snake_case column names via `snakeCase.table`, so the default
// dialect serialises embedded columns to their real names, as the live query does.
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

const baseEffortRow = {
  date: "2026-06-02",
  agent: "claude",
  levels: [{ level: "high", sessionCount: 2 }],
  classifiedSessionCount: 2,
  unclassifiedSessionCount: 1,
};

describe("updatedAt", () => {
  // The upserts no longer set `updatedAt` themselves; `$onUpdate` adds it to
  // every update set Drizzle builds, including `onConflictDoUpdate`.
  it.each([
    ["token_usage", tokenUsage],
    ["token_effort_usage", tokenEffortUsage],
  ])("should be stamped on every %s update", (_, table) => {
    const { sql } = dialect.sqlToQuery(dialect.buildUpdateSet(table, {}));
    expect(sql).toBe('"updated_at" = $1');
  });
});

describe("upsertTokenUsage", () => {
  beforeEach(() => {
    onConflictConfigs.length = 0;
  });

  it("should only overwrite a day when the incoming snapshot has more tokens or more reasoning", async () => {
    await upsertTokenUsage([baseRow]);

    expect(onConflictConfigs).toHaveLength(1);
    const { setWhere } = onConflictConfigs[0];
    expect(setWhere).toBeDefined();

    // The guard makes the stored lifetime total non-decreasing: a pruned-log
    // re-parse with a smaller total is ignored; a larger (more complete) parse wins,
    // and at an equal total a finer reasoning split wins (row comparison).
    const { sql } = dialect.sqlToQuery(setWhere as never);
    expect(sql).toBe(
      '((excluded.total_tokens > "token_usage"."total_tokens") or (((excluded.total_tokens = "token_usage"."total_tokens") and (excluded.reasoning_tokens > "token_usage"."reasoning_tokens"))))',
    );
  });

  it("should keep each device's snapshot of a session as its own row", async () => {
    await upsertTokenUsage([
      { ...baseRow, device: "mac-mini", session: "0123456789abcdef" },
    ]);

    // Each session is its own row, and each device keeps its own copy of it;
    // the profile read collapses copies of one session across devices.
    expect(onConflictConfigs[0].target).toEqual([
      tokenUsage.date,
      tokenUsage.agent,
      tokenUsage.provider,
      tokenUsage.model,
      tokenUsage.device,
      tokenUsage.session,
    ]);
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

describe("upsertTokenEffortUsage", () => {
  beforeEach(() => {
    onConflictConfigs.length = 0;
    batch.mockClear();
  });

  it("should accept changed classifications without decreasing session coverage", async () => {
    await upsertTokenEffortUsage([baseEffortRow]);

    expect(onConflictConfigs).toHaveLength(1);
    const { setWhere } = onConflictConfigs[0];
    expect(setWhere).toBeDefined();

    const { sql } = dialect.sqlToQuery(setWhere as never);
    expect(sql.replace(/\s+/g, " ").trim()).toBe(
      '(excluded.classified_session_count + excluded.unclassified_session_count) > ("token_effort_usage"."classified_session_count" + "token_effort_usage"."unclassified_session_count") or ( (excluded.classified_session_count + excluded.unclassified_session_count) = ("token_effort_usage"."classified_session_count" + "token_effort_usage"."unclassified_session_count") and excluded.classified_session_count >= "token_effort_usage"."classified_session_count" and (excluded.classified_session_count > "token_effort_usage"."classified_session_count" or excluded.levels is distinct from "token_effort_usage"."levels") )',
    );
  });

  it("should point effort columns at the incoming (excluded) value", async () => {
    await upsertTokenEffortUsage([baseEffortRow]);

    const { set } = onConflictConfigs[0];
    for (const column of [
      "levels",
      "classifiedSessionCount",
      "unclassifiedSessionCount",
    ]) {
      const { sql } = dialect.sqlToQuery(set[column] as never);
      expect(sql).toBe(
        `excluded.${column.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`,
      );
    }
  });

  it("should return 0 and skip the DB when given an empty array", async () => {
    const submitted = await upsertTokenEffortUsage([]);

    expect(submitted).toBe(0);
    expect(onConflictConfigs).toHaveLength(0);
    expect(batch).not.toHaveBeenCalled();
  });

  it("should submit all effort chunks in one database batch", async () => {
    const rows = Array.from({ length: 2500 }, () => baseEffortRow);

    expect(await upsertTokenEffortUsage(rows)).toBe(2500);
    expect(onConflictConfigs).toHaveLength(3);
    expect(batch).toHaveBeenCalledOnce();
    expect(batch.mock.calls[0][0]).toHaveLength(3);
    for (const config of onConflictConfigs) {
      expect(config.setWhere).toBeDefined();
    }
  });
});

describe("reconcileLegacyRows", () => {
  const snapshot = (
    legacy: boolean,
    totalTokens: number,
    overrides: Partial<{ date: string; updatedAt: Date }> = {},
  ) => ({
    date: "2026-09-12",
    agent: "claude",
    provider: "anthropic",
    model: "claude-opus-5",
    inputTokens: totalTokens,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    totalTokens,
    messages: 1,
    updatedAt: new Date("2026-09-12T00:00:00Z"),
    legacy,
    ...overrides,
  });

  it("should keep the session total when it covers more than the legacy snapshot", () => {
    const rows = reconcileLegacyRows([
      snapshot(true, 100),
      snapshot(false, 150),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].totalTokens).toBe(150);
  });

  it("should keep the legacy snapshot when the day's logs have since been pruned", () => {
    const rows = reconcileLegacyRows([
      snapshot(true, 300),
      snapshot(false, 40),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].totalTokens).toBe(300);
  });

  it("should keep the latest ingest time of either snapshot", () => {
    const later = new Date("2026-09-27T10:00:00Z");
    const rows = reconcileLegacyRows([
      snapshot(true, 300),
      snapshot(false, 40, { updatedAt: later }),
    ]);

    expect(rows[0].updatedAt).toEqual(later);
  });

  it("should leave different days and models apart", () => {
    const rows = reconcileLegacyRows([
      snapshot(true, 100),
      snapshot(false, 50, { date: "2026-09-13" }),
    ]);

    expect(rows.map((row) => [row.date, row.totalTokens])).toEqual([
      ["2026-09-12", 100],
      ["2026-09-13", 50],
    ]);
    expect(rows[0]).not.toHaveProperty("legacy");
  });
});
