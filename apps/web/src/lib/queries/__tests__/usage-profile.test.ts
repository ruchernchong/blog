import type { Pricing } from "@workspace/usage/pricing";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mocks } = vi.hoisted(() => ({
  mocks: {
    batchResult: [[], [], []] as unknown[],
    unpricedRows: [] as unknown[],
    updated: [] as unknown[],
  },
}));

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

vi.mock("@/schema", async () => {
  const actual = await vi.importActual<typeof import("@/schema")>("@/schema");
  const db = {
    batch: () => Promise.resolve(mocks.batchResult),
    select: () => ({
      from: () => ({
        orderBy: () => ({}),
        where: () => Promise.resolve(mocks.unpricedRows),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve(mocks.updated) }),
      }),
    }),
  };
  return { ...actual, db };
});

import { getUsageProfile, repriceUnpricedTokenUsage } from "../usage";

const MILLION = 1_000_000;

/** $1/M input so `inputTokens / 1e6` is the derived USD cost. */
function pricingRow(
  provider: string,
  id: string,
  inputRate: string,
  outputRate = "0",
) {
  return {
    provider,
    id,
    inputRate,
    outputRate,
    cacheReadRate: "0",
    cacheWriteRate: "0",
    aliasTarget: null as string | null,
  };
}

const fixtureRegistry = [
  pricingRow("anthropic", "claude-opus", "1"),
  pricingRow("openrouter", "claude-opus", "1"),
  pricingRow("anthropic", "free", "0"),
  pricingRow("anthropic", "m1", "1"),
  pricingRow("xai", "grok-4.6", "1"),
  { ...pricingRow("xai", "grok-4.6-build", "0"), aliasTarget: "grok-4.6" },
];

const base = {
  date: "2026-01-01",
  agent: "claude",
  provider: "anthropic",
  model: "claude-opus",
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  reasoningTokens: 0,
  totalTokens: 0,
  // Deliberately wrong: the profile must ignore stored costUsd.
  costUsd: "999" as string | null,
  messages: 1,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("getUsageProfile", () => {
  beforeEach(() => {
    mocks.batchResult = [[], [], []];
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return an empty profile when there are no rows", async () => {
    const profile = await getUsageProfile();

    expect(profile.contributions).toEqual([]);
    expect(profile.summary.bestDay).toBeNull();
    expect(profile.lastUpdated).toBeNull();
  });

  it("should build contributions, rollups and summary from rows", async () => {
    mocks.batchResult = [
      [
        {
          ...base,
          date: "2025-12-31",
          inputTokens: MILLION,
          totalTokens: 100,
        },
        { ...base, inputTokens: 2 * MILLION, totalTokens: 400 },
        {
          ...base,
          provider: "openrouter",
          inputTokens: 0.5 * MILLION,
          totalTokens: 10,
        },
        {
          ...base,
          date: "2026-01-03",
          agent: "codex",
          model: "unknown",
          totalTokens: 300,
        },
        {
          ...base,
          date: "2026-01-04",
          model: "free",
          totalTokens: 0,
        },
        {
          ...base,
          date: "2026-01-05",
          model: "m1",
          inputTokens: MILLION,
          totalTokens: 500,
        },
        { ...base, date: "2026-01-05", model: "m2", totalTokens: 1 },
        { ...base, date: "2026-01-05", model: "m3", totalTokens: 1 },
        { ...base, date: "2026-01-05", model: "m4", totalTokens: 1 },
        { ...base, date: "2026-01-05", model: "m5", totalTokens: 1 },
      ],
      [
        {
          date: "2026-01-01",
          agent: "claude",
          levels: [{ level: "high", sessionCount: 2 }],
          classifiedSessionCount: 2,
          unclassifiedSessionCount: 0,
          updatedAt: new Date("2026-01-09T00:00:00Z"),
        },
      ],
      fixtureRegistry,
    ];

    const profile = await getUsageProfile();

    // A gap day (2026-01-02) is filled in, so the range is six days long.
    expect(profile.contributions).toHaveLength(6);
    expect(profile.contributions[2].totals.tokens).toBe(0);
    expect(profile.contributions.map((day) => day.intensity)).toEqual([
      1, 3, 0, 2, 0, 4,
    ]);
    // An all-unpriced day reports a null cost, and only the top 4 models are kept.
    expect(profile.contributions[3].totals.cost).toBeNull();
    expect(profile.contributions[5].models).toHaveLength(4);

    const opus = profile.byModel.find((row) => row.key === "claude-opus");
    expect(opus?.provider).toBeNull();
    // $1 + $2 (anthropic) + $0.50 (openrouter) from 1M-token input buckets.
    expect(opus?.cost).toBe(3.5);
    expect(
      profile.byModel.find((row) => row.key === "unknown")?.cost,
    ).toBeNull();
    expect(profile.byModel.find((row) => row.key === "free")?.cost).toBe(0);
    expect(
      profile.byModel.find((row) => row.key === "free")?.costPerMillionTokens,
    ).toBeNull();

    expect(profile.years.map((year) => year.year)).toEqual(["2025", "2026"]);
    expect(profile.summary.activeDays).toBe(4);
    expect(profile.summary.longestStreak).toBe(2);
    expect(profile.summary.currentStreak).toBe(1);
    expect(profile.summary.bestDay?.date).toBe("2026-01-01");
    expect(profile.effort?.classifiedSessionCount).toBe(2);
    expect(profile.lastUpdated).toBe("2026-01-09T00:00:00.000Z");
  });

  it("should fold alias and -build model ids into one model row", async () => {
    mocks.batchResult = [
      [
        // Cursor stores the id the user picked; the Grok CLI stores the served
        // -build id (registered as an alias). A third id has no alias row and
        // relies on the suffix fallback.
        {
          ...base,
          agent: "cursor",
          provider: "xai",
          model: "grok-4.6",
          inputTokens: MILLION,
          totalTokens: 10,
        },
        {
          ...base,
          agent: "grok",
          provider: "xai",
          model: "grok-4.6-build",
          inputTokens: 2 * MILLION,
          totalTokens: 20,
        },
        {
          ...base,
          agent: "grok",
          provider: "xai",
          model: "grok-4.5-build",
          totalTokens: 5,
        },
      ],
      [],
      fixtureRegistry,
    ];

    const profile = await getUsageProfile();

    expect(profile.byModel.map((row) => row.key)).toEqual([
      "grok-4.6",
      "grok-4.5",
    ]);
    const grok = profile.byModel[0];
    expect(grok.tokens).toBe(30);
    // Priced per stored id ($1/M via the alias), then summed under the target.
    expect(grok.cost).toBe(3);
    expect(profile.contributions[0].models.map((row) => row.model)).toEqual([
      "grok-4.6",
      "grok-4.5",
    ]);
  });

  it("should have no active days when every row has zero tokens", async () => {
    mocks.batchResult = [[{ ...base, totalTokens: 0 }], [], fixtureRegistry];

    const profile = await getUsageProfile();

    expect(profile.summary.activeDays).toBe(0);
    expect(profile.summary.bestDay).toBeNull();
    expect(profile.effort).toBeNull();
    expect(profile.lastUpdated).toBe("2026-01-01T00:00:00.000Z");
  });

  it("should cap the sparkline at 90 days", async () => {
    mocks.batchResult = [
      [
        { ...base, date: "2025-01-01", totalTokens: 100 },
        { ...base, date: "2025-07-20", totalTokens: 200 },
      ],
      [],
      fixtureRegistry,
    ];

    const profile = await getUsageProfile();

    expect(profile.byModel[0].sparkline).toHaveLength(90);
  });
});

describe("repriceUnpricedTokenUsage", () => {
  const pricing = {
    costOf: (_tokens: unknown, model: string) =>
      model === "claude-opus" ? 1.23456789 : null,
  } as unknown as Pricing;

  it("should reprice rows that now have a price", async () => {
    mocks.unpricedRows = [base, { ...base, model: "unknown" }];
    mocks.updated = [{ date: base.date }];

    const result = await repriceUnpricedTokenUsage(pricing);

    expect(result).toEqual({ scanned: 2, repriced: 1, stillUnpriced: 1 });
  });

  it("should not count a row when the guarded update matches nothing", async () => {
    mocks.unpricedRows = [base];
    mocks.updated = [];

    const result = await repriceUnpricedTokenUsage(pricing);

    expect(result).toEqual({ scanned: 1, repriced: 0, stillUnpriced: 0 });
  });
});
