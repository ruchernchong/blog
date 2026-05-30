import { addDays, format, getDay, parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { buildHeatmapLayout } from "../heatmap-layout";
import type { DayContribution, TokenBreakdown } from "../types";

const emptyBreakdown: TokenBreakdown = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  reasoning: 0,
};

/** Build a contiguous run of dense days starting from `start` (inclusive). */
function makeDays(start: string, count: number): DayContribution[] {
  const startDate = parseISO(start);
  return Array.from({ length: count }, (_, i) => {
    // date-fns local arithmetic, matching the helper's parseISO usage.
    const date = format(addDays(startDate, i), "yyyy-MM-dd");
    return {
      date,
      totals: { tokens: 0, cost: 0, messages: 0 },
      intensity: 0,
      tokenBreakdown: emptyBreakdown,
      agents: [],
    } satisfies DayContribution;
  });
}

describe("buildHeatmapLayout", () => {
  it("should return empty weeks and labels for no days", () => {
    expect(buildHeatmapLayout([])).toEqual({ weeks: [], monthLabels: [] });
  });

  it("should pad the first column so the first day lands on its weekday", () => {
    // 2026-01-07 is a Wednesday → 3 leading padding cells (Sun, Mon, Tue).
    const start = "2026-01-07";
    const { weeks } = buildHeatmapLayout(makeDays(start, 1));
    const leadingPadding = getDay(parseISO(start));

    expect(leadingPadding).toBe(3);
    for (let i = 0; i < leadingPadding; i++) {
      expect(weeks[0][i]).toEqual({ date: null, contribution: null });
    }
    expect(weeks[0][leadingPadding].date).toBe(start);
  });

  it("should pad every week column to exactly 7 cells", () => {
    const { weeks } = buildHeatmapLayout(makeDays("2026-01-07", 30));
    expect(weeks.length).toBeGreaterThan(0);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("should label each new month once at its first week column", () => {
    // Span Jan→Mar 2026 so at least three month labels appear.
    const { monthLabels } = buildHeatmapLayout(makeDays("2026-01-01", 75));
    const labels = monthLabels.map((m) => m.label);

    expect(labels).toEqual(["Jan", "Feb", "Mar"]);
    // weekIndex is monotonically increasing (one entry per month, in order).
    const indices = monthLabels.map((m) => m.weekIndex);
    expect([...indices].sort((a, b) => a - b)).toEqual(indices);
  });
});
