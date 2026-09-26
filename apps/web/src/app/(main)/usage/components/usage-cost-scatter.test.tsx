import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { UsageBreakdownRow } from "@/lib/usage/types";
import { UsageCostScatter } from "./usage-cost-scatter";

function row(key: string, tokens: number, cost: number | null) {
  return {
    key,
    provider: "anthropic",
    providers: ["anthropic"],
    tokens,
    cost,
    costPerMillionTokens: cost === null ? null : (cost / tokens) * 1_000_000,
    messages: 10,
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
  } satisfies UsageBreakdownRow;
}

describe("UsageCostScatter", () => {
  it("should plot priced models with direct labels", async () => {
    const screen = await render(
      <div style={{ width: 800 }}>
        <UsageCostScatter
          byModel={[row("opus", 2_000_000, 30), row("haiku", 5_000_000, 5)]}
          modelDisplayNames={{ opus: "Claude Opus" }}
        />
      </div>,
    );

    await expect
      .element(screen.getByRole("heading", { name: "Where the money goes" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Claude Opus", { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("haiku", { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(
        screen.getByText(
          /Biggest spenders: Claude Opus, US\$30\.00 at US\$15\.00 per million tokens; haiku/,
        ),
      )
      .toBeInTheDocument();
    // The chart is decorative next to the summary, so it must not take focus.
    expect(
      screen.container
        .querySelector("svg.recharts-surface")
        ?.hasAttribute("tabindex"),
    ).toBe(false);
  });

  it("should render the empty state without priced usage", async () => {
    const screen = await render(
      <UsageCostScatter
        byModel={[row("unknown", 1_000, null)]}
        modelDisplayNames={{}}
      />,
    );

    await expect
      .element(screen.getByText("No priced usage yet."))
      .toBeInTheDocument();
  });
});
