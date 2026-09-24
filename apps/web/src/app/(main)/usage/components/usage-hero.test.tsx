import type { UsageSummary } from "@workspace/usage/types";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { UsageHero } from "./usage-hero";

const summary: UsageSummary = {
  totalTokens: 4_200_000_000,
  totalCost: 12_400,
  totalDays: 300,
  activeDays: 212,
  averagePerDay: 58.49,
  maxCostInSingleDay: 400,
  agents: ["claude", "codex"],
  providers: ["anthropic", "openai"],
  models: ["claude-opus", "gpt-5.5", "claude-sonnet"],
  currentStreak: 14,
  longestStreak: 30,
  bestDay: null,
  favouriteModel: "claude-opus",
};

describe("UsageHero", () => {
  it("should render the narrative and headline figures", async () => {
    const screen = await render(
      <UsageHero
        description="Not what I paid."
        narrative="Since March 2025: 4.2B tokens."
        summary={summary}
      />,
    );

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Usage" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Since March 2025: 4.2B tokens."))
      .toBeInTheDocument();
    await expect.element(screen.getByText("US$12.4K")).toBeInTheDocument();
    await expect.element(screen.getByText("4.2B")).toBeInTheDocument();
    await expect.element(screen.getByText("212")).toBeInTheDocument();
    await expect.element(screen.getByText("3")).toBeInTheDocument();
    await expect
      .element(screen.getByText("Not what I paid."))
      .toBeInTheDocument();
  });

  it("should render the empty state and last-updated slot", async () => {
    const screen = await render(
      <UsageHero
        description="Not what I paid."
        lastUpdated={<span>Updated today</span>}
        narrative={null}
        summary={{ ...summary, models: [] }}
      />,
    );

    await expect
      .element(screen.getByText("No usage recorded yet."))
      .toBeInTheDocument();
    await expect.element(screen.getByText("Updated today")).toBeInTheDocument();
  });
});
