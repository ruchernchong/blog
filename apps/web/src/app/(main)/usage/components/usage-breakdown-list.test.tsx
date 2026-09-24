import type { UsageBreakdownRow } from "@workspace/usage/types";
import { describe, expect, it, vi } from "vitest";
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
  it("should render each row's figures and open the model on press", async () => {
    const onSelectModel = vi.fn();
    const screen = await render(
      <UsageBreakdownList
        names={names}
        onSelectModel={onSelectModel}
        rows={[row]}
        viewId="model"
      />,
    );

    await expect.element(screen.getByText("Anthropic")).toBeInTheDocument();
    await expect.element(screen.getByText("2M")).toBeInTheDocument();
    await expect.element(screen.getByText("US$30.00")).toBeInTheDocument();
    await expect.element(screen.getByText("1,200")).toBeInTheDocument();

    await screen
      .getByRole("button", { name: "Open profile for Claude Opus" })
      .click();
    expect(onSelectModel).toHaveBeenCalledWith("opus");
  });

  it("should render plain names outside the model view", async () => {
    const screen = await render(
      <UsageBreakdownList names={names} rows={[row]} viewId="agent" />,
    );

    await expect.element(screen.getByText("opus")).toBeInTheDocument();
    await expect.element(screen.getByRole("button")).not.toBeInTheDocument();
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
