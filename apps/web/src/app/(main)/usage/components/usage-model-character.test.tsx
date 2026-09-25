import type { UsageBreakdownRow } from "@workspace/usage/types";
import {
  type OnUrlUpdateFunction,
  withNuqsTestingAdapter,
} from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
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
  it("should render each model's character stats", async () => {
    const screen = await render(
      <UsageModelCharacter
        byModel={[
          row("opus"),
          row("mystery", { cost: null, costPerMillionTokens: null }),
        ]}
        modelDisplayNames={{ opus: "Claude Opus" }}
      />,
      { wrapper: withNuqsTestingAdapter() },
    );

    const opus = screen.getByRole("row", { name: /Claude Opus/ });
    await expect.element(opus.getByText("60%")).toBeInTheDocument();
    await expect.element(opus.getByText("US$1.00")).toBeInTheDocument();
    await expect
      .element(opus.getByText("2", { exact: true }))
      .toBeInTheDocument();
    await expect.element(opus.getByText("02/01/2026")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("row", { name: /mystery/ }).getByText("N.A."))
      .toBeInTheDocument();
  });

  it("should open a model's profile from its row", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const screen = await render(
      <UsageModelCharacter
        byModel={[row("opus")]}
        modelDisplayNames={{ opus: "Claude Opus" }}
      />,
      { wrapper: withNuqsTestingAdapter({ onUrlUpdate }) },
    );

    await screen
      .getByRole("button", { name: "View profile for Claude Opus" })
      .click();

    await expect.poll(() => onUrlUpdate.mock.calls.length).toBeGreaterThan(0);
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get("model")).toBe(
      "opus",
    );
  });

  it("should reveal models beyond the first few with Show all", async () => {
    const byModel = Array.from({ length: 9 }, (_, index) =>
      row(`m${index + 1}`, { tokens: 1000 - index }),
    );
    const screen = await render(
      <UsageModelCharacter byModel={byModel} modelDisplayNames={{}} />,
      { wrapper: withNuqsTestingAdapter() },
    );

    const ninth = screen.getByRole("button", { name: "View profile for m9" });
    await expect.element(ninth).not.toBeInTheDocument();

    await screen.getByRole("button", { name: "Show all 9 models" }).click();

    await expect.element(ninth).toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Show fewer models" }))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("should skip idle models and show the empty state", async () => {
    const screen = await render(
      <UsageModelCharacter
        byModel={[row("idle", { tokens: 0 })]}
        modelDisplayNames={{}}
      />,
      { wrapper: withNuqsTestingAdapter() },
    );

    await expect
      .element(screen.getByText("No model usage yet."))
      .toBeInTheDocument();
  });
});
