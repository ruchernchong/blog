import { describe, expect, it } from "vitest";
import {
  agentLabel,
  buildUsageNarrative,
  buildUsageNarrativeParts,
} from "./narrative";

const summary = {
  totalTokens: 4_200_000_000,
  activeDays: 212,
  currentStreak: 14,
  longestStreak: 30,
};

describe("buildUsageNarrative", () => {
  it("should describe volume, top model, agent, and current streak", () => {
    expect(
      buildUsageNarrative({
        summary,
        firstActiveDate: "2025-03-04",
        topModel: "Claude Opus 4.1",
        topAgent: "claude",
      }),
    ).toBe(
      "Since March 2025: 4.2B tokens across 212 active days, mostly Claude Opus 4.1 via Claude Code. Current streak: 14 days.",
    );
  });

  it("should fall back to the longest streak when there is no current streak", () => {
    expect(
      buildUsageNarrative({
        summary: { ...summary, currentStreak: 0, longestStreak: 1 },
        firstActiveDate: "2025-03-04",
        topModel: "GPT-5.5",
        topAgent: null,
      }),
    ).toBe(
      "Since March 2025: 4.2B tokens across 212 active days, mostly GPT-5.5. Longest streak: 1 day.",
    );
  });

  it("should omit the model clause when there is no top model", () => {
    expect(
      buildUsageNarrative({
        summary: { ...summary, activeDays: 1 },
        firstActiveDate: "2026-01-01",
        topModel: null,
        topAgent: "codex",
      }),
    ).toBe(
      "Since January 2026: 4.2B tokens across 1 active day. Current streak: 14 days.",
    );
  });

  it("should return null when there is no usage", () => {
    expect(
      buildUsageNarrative({
        summary: { ...summary, totalTokens: 0 },
        firstActiveDate: "2026-01-01",
        topModel: null,
        topAgent: null,
      }),
    ).toBeNull();
    expect(
      buildUsageNarrative({
        summary,
        firstActiveDate: null,
        topModel: null,
        topAgent: null,
      }),
    ).toBeNull();
  });
});

describe("agentLabel", () => {
  it("should map known agents and pass unknown ones through", () => {
    expect(agentLabel("opencode")).toBe("OpenCode");
    expect(agentLabel("something-new")).toBe("something-new");
  });
});

describe("buildUsageNarrativeParts", () => {
  it("should highlight the figures, model, agent, and streak", () => {
    const parts = buildUsageNarrativeParts({
      summary,
      firstActiveDate: "2025-03-04",
      topModel: "Claude Opus 4.1",
      topAgent: "claude",
    });

    expect(
      parts?.filter((part) => part.highlight).map((part) => part.text),
    ).toEqual([
      "4.2B tokens",
      "212 active days",
      "Claude Opus 4.1",
      "Claude Code",
      "14 days",
    ]);
  });

  it("should return null when there is no usage", () => {
    expect(
      buildUsageNarrativeParts({
        summary,
        firstActiveDate: null,
        topModel: null,
        topAgent: null,
      }),
    ).toBeNull();
  });
});
