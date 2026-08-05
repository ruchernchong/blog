import { describe, expect, it } from "vitest";
import { usageIngestSchema } from "../ingest";
import {
  compareEffortLevels,
  effortLevelLabel,
  foldEffortSummary,
  sortEffortLevels,
} from "../types";

const validTokenRow = {
  date: "2026-06-02",
  agent: "claude",
  provider: "anthropic",
  model: "claude-opus-4-7",
  inputTokens: 100,
  outputTokens: 50,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  reasoningTokens: 0,
  totalTokens: 150,
  costUsd: "0.010000",
  messages: 1,
};

const validEffortRow = {
  date: "2026-06-02",
  agent: "claude",
  levels: [{ level: "high", sessionCount: 2 }],
  classifiedSessionCount: 2,
  unclassifiedSessionCount: 1,
};

describe("usageIngestSchema effort fields", () => {
  it("should default omitted effortRows and effortSnapshotComplete", () => {
    const result = usageIngestSchema.safeParse({ rows: [validTokenRow] });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.effortRows).toEqual([]);
    expect(result.data.effortSnapshotComplete).toBe(false);
  });

  it("should accept an empty effortRows array", () => {
    const result = usageIngestSchema.safeParse({
      rows: [validTokenRow],
      effortRows: [],
      effortSnapshotComplete: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.effortRows).toEqual([]);
    expect(result.data.effortSnapshotComplete).toBe(true);
  });

  it("should accept valid camelCase effortRows", () => {
    const result = usageIngestSchema.safeParse({
      rows: [validTokenRow],
      effortRows: [validEffortRow],
      effortSnapshotComplete: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.effortRows).toEqual([validEffortRow]);
  });

  it("should reject malformed effort level sessionCount", () => {
    const result = usageIngestSchema.safeParse({
      rows: [validTokenRow],
      effortRows: [
        {
          ...validEffortRow,
          levels: [{ level: "high", sessionCount: -1 }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("should reject snake_case effort field names", () => {
    const result = usageIngestSchema.safeParse({
      rows: [validTokenRow],
      effortRows: [
        {
          date: "2026-06-02",
          agent: "claude",
          levels: [{ level: "high", session_count: 2 }],
          classified_session_count: 2,
          unclassified_session_count: 1,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("should still require at least one token row", () => {
    const result = usageIngestSchema.safeParse({
      rows: [],
      effortRows: [validEffortRow],
    });

    expect(result.success).toBe(false);
  });
});

describe("effort display helpers", () => {
  it("should label known and unknown levels", () => {
    expect(effortLevelLabel("high")).toBe("High");
    expect(effortLevelLabel("xhigh")).toBe("Extra high");
    expect(effortLevelLabel("mixed")).toBe("Mixed");
    expect(effortLevelLabel("custom_tier")).toBe("Custom Tier");
  });

  it("should order known levels, then unknowns, then mixed", () => {
    const sorted = sortEffortLevels([
      { level: "mixed", sessionCount: 1 },
      { level: "high", sessionCount: 3 },
      { level: "zeta", sessionCount: 1 },
      { level: "low", sessionCount: 2 },
      { level: "alpha", sessionCount: 1 },
    ]);

    expect(sorted.map((l) => l.level)).toEqual([
      "low",
      "high",
      "alpha",
      "zeta",
      "mixed",
    ]);
  });

  it("should compare mixed as last", () => {
    expect(compareEffortLevels("ultra", "mixed")).toBeLessThan(0);
    expect(compareEffortLevels("mixed", "alpha")).toBeGreaterThan(0);
  });
});

describe("foldEffortSummary", () => {
  it("should return null for an empty row list", () => {
    expect(foldEffortSummary([])).toBeNull();
  });

  it("should return null when no sessions were classified", () => {
    expect(
      foldEffortSummary([
        {
          levels: [],
          classifiedSessionCount: 0,
          unclassifiedSessionCount: 4,
        },
      ]),
    ).toBeNull();
  });

  it("should sum levels across days and keep display order", () => {
    const summary = foldEffortSummary([
      {
        levels: [
          { level: "high", sessionCount: 2 },
          { level: "low", sessionCount: 1 },
        ],
        classifiedSessionCount: 3,
        unclassifiedSessionCount: 1,
      },
      {
        levels: [
          { level: "high", sessionCount: 1 },
          { level: "mixed", sessionCount: 1 },
        ],
        classifiedSessionCount: 2,
        unclassifiedSessionCount: 0,
      },
    ]);

    expect(summary).toEqual({
      levels: [
        { level: "low", sessionCount: 1 },
        { level: "high", sessionCount: 3 },
        { level: "mixed", sessionCount: 1 },
      ],
      classifiedSessionCount: 5,
      unclassifiedSessionCount: 1,
    });
  });
});
