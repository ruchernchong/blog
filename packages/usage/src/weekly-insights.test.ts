import { describe, expect, it } from "vitest";
import type { TokenBreakdown, UsageFact } from "./types";
import {
  buildCacheTrend,
  buildWeeklyShare,
  isoWeekStart,
  memberShareKey,
  modelFamily,
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
      {
        key: "opus",
        tokens: [10, 0, 0, 5],
        members: [{ key: "opus", tokens: [10, 0, 0, 5] }],
      },
      {
        key: "sonnet",
        tokens: [3, 0, 0, 0],
        members: [{ key: "sonnet", tokens: [3, 0, 0, 0] }],
      },
    ]);
    expect(share.agents).toEqual([
      {
        key: "claude",
        tokens: [10, 0, 0, 5],
        members: [{ key: "claude", tokens: [10, 0, 0, 5] }],
      },
      {
        key: "cursor",
        tokens: [3, 0, 0, 0],
        members: [{ key: "cursor", tokens: [3, 0, 0, 0] }],
      },
    ]);
  });

  it("should group model versions into one family series", () => {
    const share = buildWeeklyShare([
      fact("2026-01-05", "claude-opus-4-8", 30),
      fact("2026-01-05", "claude-opus-5", 10),
      fact("2026-01-05", "gpt-5.3-codex", 20),
    ]);

    expect(share.models).toEqual([
      {
        key: "Claude Opus",
        tokens: [40],
        members: [
          { key: "claude-opus-4-8", tokens: [30] },
          { key: "claude-opus-5", tokens: [10] },
        ],
      },
      {
        key: "GPT Codex",
        tokens: [20],
        members: [{ key: "gpt-5.3-codex", tokens: [20] }],
      },
    ]);
  });

  it("should rank by summed weekly share so a quieter era keeps its own series", () => {
    const share = buildWeeklyShare(
      [
        fact("2026-01-05", "a", 10),
        fact("2026-01-12", "b", 900),
        fact("2026-01-12", "c", 100),
      ],
      2,
    );

    // "a" owns a whole week, so it outranks "c" despite fewer tokens.
    expect(share.models.map((series) => series.key)).toEqual([
      "a",
      "b",
      OTHER_SERIES_KEY,
    ]);
    expect(share.models[2]).toEqual({
      key: OTHER_SERIES_KEY,
      tokens: [0, 100],
      members: [{ key: "c", tokens: [0, 100] }],
    });
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
  it("should turn weekly tokens into per-week shares, with no series keys for idle weeks", () => {
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
      { week: "2026-01-12" },
    ]);
  });

  it("should add each member's share of the week under its member key", () => {
    const [row] = toWeeklyShareRows(
      ["2026-01-05"],
      [
        {
          key: "Claude Opus",
          tokens: [40],
          members: [
            { key: "claude-opus-5", tokens: [30] },
            { key: "claude-opus-4-8", tokens: [10] },
          ],
        },
      ],
    );

    expect(row["Claude Opus"]).toBe(1);
    expect(row[memberShareKey("Claude Opus", "claude-opus-5")]).toBe(0.75);
    expect(row[memberShareKey("Claude Opus", "claude-opus-4-8")]).toBe(0.25);
  });
});

describe("modelFamily", () => {
  it("should map model slugs to their family", () => {
    expect(modelFamily("claude-opus-5")).toBe("Claude Opus");
    expect(modelFamily("gpt-5.1-codex-max")).toBe("GPT Codex");
    expect(modelFamily("gpt-5.6-sol")).toBe("GPT");
    expect(modelFamily("accounts/fireworks/routers/kimi-k2p5-turbo")).toBe(
      "Kimi",
    );
  });

  it("should keep an unrecognised slug as its own family", () => {
    expect(modelFamily("north-mini-code-free")).toBe("north-mini-code-free");
  });
});
