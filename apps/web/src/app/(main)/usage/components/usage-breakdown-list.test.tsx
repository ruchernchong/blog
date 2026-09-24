import type { UsageBreakdownRow } from "@workspace/usage/types";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { UsageBreakdownList } from "./usage-breakdown-list";

const row: UsageBreakdownRow = {
  key: "opus",
  provider: "anthropic",
  providers: ["anthropic"],
  tokens: 2_000_000,
  cost: 30,
  costPerMillionTokens: 15,
  messages: 1200,
  sparkline: [],
  firstUsed: "2026-01-01",
  lastUsed: "2026-01-02",
  activeDays: 2,
  agents: ["claude"],
  tokenBreakdown: {
    input: 2_000_000,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    reasoning: 0,
  },
};

const names = {
  providerDisplayNames: { anthropic: "Anthropic" },
  modelDisplayNames: { opus: "Claude Opus" },
};

describe("UsageBreakdownList", () => {
  it("should render each row's name, provider and figures", async () => {
    const screen = await render(
      <UsageBreakdownList names={names} rows={[row]} viewId="model" />,
    );

    await expect.element(screen.getByText("Claude Opus")).toBeInTheDocument();
    await expect.element(screen.getByText("Anthropic")).toBeInTheDocument();
    await expect.element(screen.getByText("2M")).toBeInTheDocument();
    await expect.element(screen.getByText("US$30.00")).toBeInTheDocument();
    await expect.element(screen.getByText("1,200")).toBeInTheDocument();
    await expect.element(screen.getByRole("button")).not.toBeInTheDocument();
  });

  it("should use raw keys outside the model view", async () => {
    const screen = await render(
      <UsageBreakdownList names={names} rows={[row]} viewId="agent" />,
    );

    await expect.element(screen.getByText("opus")).toBeInTheDocument();
  });

  it("should render the empty state", async () => {
    const screen = await render(
      <UsageBreakdownList names={names} rows={[]} viewId="model" />,
    );

    await expect
      .element(screen.getByText("No results match your filters."))
      .toBeInTheDocument();
  });
});
