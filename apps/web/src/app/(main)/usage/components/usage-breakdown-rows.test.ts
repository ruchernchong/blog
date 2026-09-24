import type { UsageBreakdownRow } from "@workspace/usage/types";
import { describe, expect, it } from "vitest";
import {
  compareRows,
  filterRows,
  providerOptionsFor,
  rowDisplayName,
} from "./usage-breakdown-rows";

function row(
  key: string,
  providers: string[],
  tokens: number,
  cost: number | null,
): UsageBreakdownRow {
  return {
    key,
    provider: providers.length === 1 ? providers[0] : null,
    providers,
    tokens,
    cost,
    costPerMillionTokens: cost === null ? null : (cost / tokens) * 1_000_000,
    messages: tokens / 10,
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

const names = {
  providerDisplayNames: { anthropic: "Anthropic", openai: "OpenAI" },
  modelDisplayNames: { opus: "Claude Opus" },
};

const rows = [
  row("opus", ["anthropic"], 300, 9),
  row("gpt", ["openai", "opencode"], 200, null),
  row("free", ["anthropic"], 100, 0),
];

describe("rowDisplayName", () => {
  it("should resolve names per view and fall back to the key", () => {
    expect(rowDisplayName(rows[0], "model", names)).toBe("Claude Opus");
    expect(rowDisplayName(row("openai", [], 1, 0), "provider", names)).toBe(
      "OpenAI",
    );
    expect(rowDisplayName(rows[0], "agent", names)).toBe("opus");
  });
});

describe("filterRows", () => {
  const none = { search: "", providerFilter: "all", freeOnly: false };

  it("should search display names and provider names", () => {
    expect(
      filterRows(rows, "model", { ...none, search: "claude" }, names).map(
        (r) => r.key,
      ),
    ).toEqual(["opus"]);
    expect(
      filterRows(rows, "model", { ...none, search: "openai" }, names).map(
        (r) => r.key,
      ),
    ).toEqual(["gpt"]);
  });

  it("should filter by provider and to free or unpriced rows", () => {
    expect(
      filterRows(rows, "model", { ...none, providerFilter: "opencode" }, names),
    ).toEqual([rows[1]]);
    expect(
      filterRows(rows, "model", { ...none, freeOnly: true }, names).map(
        (r) => r.key,
      ),
    ).toEqual(["gpt", "free"]);
  });
});

describe("compareRows", () => {
  it("should sort N.A. costs below priced ones when descending", () => {
    const sorted = [...rows].sort((a, b) =>
      compareRows(
        a,
        b,
        { column: "cost", direction: "descending" },
        "model",
        names,
      ),
    );
    expect(sorted.map((r) => r.key)).toEqual(["opus", "free", "gpt"]);
  });

  it("should sort by display name ascending", () => {
    const sorted = [...rows].sort((a, b) =>
      compareRows(
        a,
        b,
        { column: "key", direction: "ascending" },
        "model",
        names,
      ),
    );
    expect(sorted.map((r) => r.key)).toEqual(["opus", "free", "gpt"]);
  });
});

describe("providerOptionsFor", () => {
  it("should list providers by label, and none for the provider view", () => {
    expect(
      providerOptionsFor(rows, "model", names.providerDisplayNames),
    ).toEqual([
      { key: "anthropic", label: "Anthropic" },
      { key: "openai", label: "OpenAI" },
      { key: "opencode", label: "opencode" },
    ]);
    expect(providerOptionsFor(rows, "provider", {})).toEqual([]);
  });
});
