import { describe, expect, it } from "vitest";
import type { UsageBreakdownRow } from "@/lib/usage/types";
import { logAxis, toCostPoints } from "./usage-cost-points";

function row(
  key: string,
  tokens: number,
  cost: number | null,
): UsageBreakdownRow {
  return {
    key,
    provider: "anthropic",
    providers: ["anthropic"],
    tokens,
    cost,
    costPerMillionTokens:
      cost !== null && tokens > 0 ? (cost / tokens) * 1_000_000 : null,
    messages: 3,
    sparkline: [],
    firstUsed: "2026-01-01",
    lastUsed: "2026-01-02",
    activeDays: 2,
    agents: ["claude"],
    tokenBreakdown: {
      input: tokens,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      reasoning: 0,
    },
  };
}

describe("toCostPoints", () => {
  it("should keep priced models with cost and label the biggest spenders", () => {
    const points = toCostPoints(
      [
        row("opus", 2_000_000, 30),
        row("sonnet", 4_000_000, 12),
        row("haiku", 1_000_000, 1),
        row("free", 1_000_000, 0),
        row("unknown", 1_000_000, null),
      ],
      { opus: "Claude Opus" },
      2,
    );

    expect(points.map((point) => point.key)).toEqual([
      "opus",
      "sonnet",
      "haiku",
    ]);
    expect(points[0]).toMatchObject({
      label: "Claude Opus",
      rate: 15,
      directLabel: "Claude Opus",
    });
    expect(points[1].directLabel).toBe("sonnet");
    expect(points[2].directLabel).toBe("");
  });
});

describe("logAxis", () => {
  it("should pad the domain and place 1-2-5 ticks inside it", () => {
    const axis = logAxis([8, 300]);

    expect(axis.domain).toEqual([4, 600]);
    expect(axis.ticks).toEqual([5, 10, 20, 50, 100, 200, 500]);
  });

  it("should fall back to a unit decade without positive values", () => {
    expect(logAxis([0])).toEqual({ domain: [1, 10], ticks: [1, 10] });
  });
});
