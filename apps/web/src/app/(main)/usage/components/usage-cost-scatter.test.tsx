import type { UsageBreakdownRow } from "@workspace/usage/types";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
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
    await expect.element(screen.getByText("Claude Opus")).toBeInTheDocument();
    await expect.element(screen.getByText("haiku")).toBeInTheDocument();
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
