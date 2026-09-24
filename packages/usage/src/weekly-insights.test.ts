import { describe, expect, it } from "vitest";
import type { TokenBreakdown, UsageFact } from "./types";
import {
  buildCacheTrend,
  buildWeeklyShare,
  isoWeekStart,
  OTHER_SERIES_KEY,
  toWeeklyShareRows,
} from "./weekly-insights";

function fact(
  date: string,
  model: string,
  totalTokens: number,
  overrides: Partial<UsageFact> = {},
): UsageFact {
  const tokens: TokenBreakdown = {
    input: totalTokens,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    reasoning: 0,
  };
  return {
    date,
    agent: "claude",
    provider: "anthropic",
    model,
    tokens,
    totalTokens,
    messages: 1,
    cost: 0,
    cacheSavings: null,
    ...overrides,
  };
}

describe("isoWeekStart", () => {
  it("should return the Monday of the date's ISO week", () => {
    expect(isoWeekStart("2026-01-05")).toBe("2026-01-05");
    expect(isoWeekStart("2026-01-11")).toBe("2026-01-05");
    expect(isoWeekStart("2026-01-01")).toBe("2025-12-29");
  });
});

describe("buildWeeklyShare", () => {
  it("should bucket tokens into dense ISO weeks per model and agent", () => {
    const share = buildWeeklyShare([
      fact("2026-01-26", "opus", 5),
      fact("2026-01-05", "opus", 10),
      fact("2026-01-11", "sonnet", 3, { agent: "cursor" }),
    ]);

    expect(share.weeks).toEqual([
      "2026-01-05",
      "2026-01-12",
      "2026-01-19",
      "2026-01-26",
    ]);
    expect(share.models).toEqual([
      { key: "opus", tokens: [10, 0, 0, 5] },
      { key: "sonnet", tokens: [3, 0, 0, 0] },
    ]);
    expect(share.agents).toEqual([
      { key: "claude", tokens: [10, 0, 0, 5] },
      { key: "cursor", tokens: [3, 0, 0, 0] },
    ]);
  });

  it("should fold keys beyond the top N into a trailing other series", () => {
    const share = buildWeeklyShare(
      [
        fact("2026-01-05", "a", 30),
        fact("2026-01-05", "b", 20),
        fact("2026-01-05", "c", 10),
        fact("2026-01-12", "d", 5),
      ],
      2,
    );

    expect(share.models).toEqual([
      { key: "a", tokens: [30, 0] },
      { key: "b", tokens: [20, 0] },
      { key: OTHER_SERIES_KEY, tokens: [10, 5] },
    ]);
  });

  it("should return empty series when there are no facts", () => {
    expect(buildWeeklyShare([])).toEqual({ weeks: [], models: [], agents: [] });
  });
});

describe("buildCacheTrend", () => {
  it("should compute weekly hit rate and sum priced savings", () => {
    const trend = buildCacheTrend([
      fact("2026-01-05", "opus", 100, {
        tokens: {
          input: 20,
          output: 0,
          cacheRead: 60,
          cacheWrite: 20,
          reasoning: 0,
        },
        cacheSavings: 1.5,
      }),
      fact("2026-01-06", "free", 100, {
        tokens: {
          input: 100,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          reasoning: 0,
        },
        cacheSavings: null,
      }),
      fact("2026-01-19", "free", 10, { cacheSavings: null }),
    ]);

    expect(trend).toEqual([
      { week: "2026-01-05", hitRate: 60 / 200, savings: 1.5 },
      { week: "2026-01-12", hitRate: null, savings: null },
      { week: "2026-01-19", hitRate: 0, savings: null },
    ]);
  });
});

describe("toWeeklyShareRows", () => {
  it("should turn weekly tokens into per-week shares", () => {
    expect(
      toWeeklyShareRows(
        ["2026-01-05", "2026-01-12"],
        [
          { key: "a", tokens: [30, 0] },
          { key: "b", tokens: [10, 0] },
        ],
      ),
    ).toEqual([
      { week: "2026-01-05", a: 0.75, b: 0.25 },
      { week: "2026-01-12", a: 0, b: 0 },
    ]);
  });
});
