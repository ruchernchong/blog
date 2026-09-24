import type { UsageBreakdownRow } from "@workspace/usage/types";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { UsageModelCharacter } from "./usage-model-character";

function row(
  key: string,
  overrides: Partial<UsageBreakdownRow> = {},
): UsageBreakdownRow {
  return {
    key,
    provider: "anthropic",
    providers: ["anthropic"],
    tokens: 540,
    cost: 2,
    costPerMillionTokens: 1,
    messages: 4,
    sparkline: [],
    firstUsed: "2026-01-01",
    lastUsed: "2026-01-02",
    activeDays: 2,
    agents: ["claude"],
    tokenBreakdown: {
      input: 100,
      output: 30,
      cacheRead: 300,
      cacheWrite: 100,
      reasoning: 10,
    },
    ...overrides,
  };
}

describe("UsageModelCharacter", () => {
  it("should render each model's character ratios", async () => {
    const screen = await render(
      <UsageModelCharacter
        byModel={[row("opus"), row("mystery", { cost: null })]}
        modelDisplayNames={{ opus: "Claude Opus" }}
      />,
    );

    const opus = screen.getByRole("row", { name: /Claude Opus/ });
    await expect.element(opus.getByText("60%")).toBeInTheDocument();
    await expect.element(opus.getByText("0.08×")).toBeInTheDocument();
    await expect.element(opus.getByText("25%")).toBeInTheDocument();
    await expect.element(opus.getByText("135")).toBeInTheDocument();
    await expect.element(opus.getByText("US$0.50")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("row", { name: /mystery/ }).getByText("N.A."))
      .toBeInTheDocument();
  });

  it("should skip idle models and show the empty state", async () => {
    const screen = await render(
      <UsageModelCharacter
        byModel={[row("idle", { tokens: 0 })]}
        modelDisplayNames={{}}
      />,
    );

    await expect
      .element(screen.getByText("No model usage yet."))
      .toBeInTheDocument();
  });
});
