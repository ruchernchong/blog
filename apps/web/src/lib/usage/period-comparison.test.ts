import { describe, expect, it } from "vitest";
import { comparePeriodLengths, comparePeriods } from "./period-comparison";
import type { DayContribution } from "./types";

function day(
  date: string,
  tokens: number,
  cost: number | null = tokens / 100,
  models: [string, number][] = tokens > 0 ? [["opus", tokens]] : [],
): DayContribution {
  return {
    date,
    totals: { tokens, cost, messages: tokens > 0 ? 1 : 0 },
    intensity: 0,
    tokenBreakdown: {
      input: tokens,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      reasoning: 0,
    },
    agents: [],
    models: models.map(([model, modelTokens]) => ({
      model,
      tokens: modelTokens,
      cost: null,
    })),
  };
}

const contributions = [
  day("2026-01-01", 100),
  day("2026-01-02", 0),
  day("2026-01-03", 300, null, [
    ["opus", 100],
    ["sonnet", 200],
  ]),
  day("2026-01-04", 200, 3, [["sonnet", 200]]),
];

describe("comparePeriods", () => {
  it("should compare the trailing window with the one before it", () => {
    expect(comparePeriods(contributions, 2)).toEqual({
      days: 2,
      current: {
        start: "2026-01-03",
        end: "2026-01-04",
        tokens: 500,
        cost: 3,
        activeDays: 2,
        messages: 2,
        topModel: "sonnet",
      },
      previous: {
        start: "2026-01-01",
        end: "2026-01-02",
        tokens: 100,
        cost: 1,
        activeDays: 1,
        messages: 1,
        topModel: "opus",
      },
      change: { tokens: 4, cost: 2, activeDays: 1 },
    });
  });

  it("should omit the previous window when history is too short", () => {
    const comparison = comparePeriods(contributions, 3);

    expect(comparison?.current.start).toBe("2026-01-02");
    expect(comparison?.previous).toBeNull();
    expect(comparison?.change).toEqual({
      tokens: null,
      cost: null,
      activeDays: null,
    });
  });

  it("should report no change when the previous window was idle", () => {
    const comparison = comparePeriods(
      [day("2026-01-01", 0), day("2026-01-02", 50)],
      1,
    );

    expect(comparison?.previous?.topModel).toBeNull();
    expect(comparison?.change.tokens).toBeNull();
  });

  it("should return null without data", () => {
    expect(comparePeriods([], 7)).toBeNull();
    expect(comparePeriods(contributions, 0)).toBeNull();
  });
});

describe("comparePeriods with uncapped model totals", () => {
  it("should find a leader that never makes a day's capped model list", () => {
    // "steady" places outside each day's capped list but leads the window.
    const days = [
      day("2026-01-01", 100, 1, [["spiky", 60]]),
      day("2026-01-02", 100, 1, [["other", 60]]),
    ];
    const uncapped = new Map([
      [
        "2026-01-01",
        new Map([
          ["spiky", 60],
          ["steady", 40],
        ]),
      ],
      [
        "2026-01-02",
        new Map([
          ["other", 60],
          ["steady", 40],
        ]),
      ],
    ]);

    expect(comparePeriods(days, 2)?.current.topModel).toBe("spiky");
    expect(comparePeriods(days, 2, uncapped)?.current.topModel).toBe("steady");
  });

  it("should compare every offered window length", () => {
    const all = comparePeriodLengths(contributions);

    expect(Object.keys(all)).toEqual(["7", "30", "90"]);
    expect(all[7]?.current.start).toBe("2026-01-01");
  });
});
