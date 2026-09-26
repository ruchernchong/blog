import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type {
  PeriodComparison,
  PeriodTotals,
} from "@/lib/usage/period-comparison";
import { UsagePeriodClient } from "./usage-period.client";

function totals(overrides: Partial<PeriodTotals>): PeriodTotals {
  return {
    start: "2026-01-01",
    end: "2026-01-30",
    tokens: 1_000_000,
    cost: 10,
    activeDays: 10,
    messages: 5,
    topModel: "opus",
    ...overrides,
  };
}

function comparison(
  days: number,
  current: Partial<PeriodTotals>,
  previous: PeriodTotals | null,
): PeriodComparison {
  const now = totals(current);
  return {
    days,
    current: now,
    previous,
    change: {
      tokens: previous
        ? (now.tokens - previous.tokens) / previous.tokens
        : null,
      cost: previous ? (now.cost - previous.cost) / previous.cost : null,
      activeDays: previous
        ? (now.activeDays - previous.activeDays) / previous.activeDays
        : null,
    },
  };
}

const comparisons = {
  7: comparison(7, { start: "2026-01-24", tokens: 2_000_000 }, null),
  30: comparison(30, {}, totals({ tokens: 500_000, cost: 20, activeDays: 10 })),
  90: null,
};

describe("UsagePeriodClient", () => {
  it("should show the default 30-day comparison with signed changes", async () => {
    const screen = await render(
      <UsagePeriodClient
        comparisons={comparisons}
        modelDisplayNames={{ opus: "Claude Opus" }}
      />,
      { wrapper: withNuqsTestingAdapter() },
    );

    await expect.element(screen.getByText("1M")).toBeInTheDocument();
    await expect
      .element(screen.getByText(/\+100% vs previous 30 days/))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/-50% vs previous 30 days/))
      .toBeInTheDocument();
    await expect.element(screen.getByText("10 / 30")).toBeInTheDocument();
    await expect.element(screen.getByText("Claude Opus")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "30 days" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("should switch windows and note missing history", async () => {
    const screen = await render(
      <UsagePeriodClient comparisons={comparisons} modelDisplayNames={{}} />,
      { wrapper: withNuqsTestingAdapter() },
    );

    await screen.getByRole("button", { name: "7 days" }).click();

    await expect.element(screen.getByText("2M")).toBeInTheDocument();
    await expect
      .element(screen.getByText("No prior 7 days").first())
      .toBeInTheDocument();
    await expect.element(screen.getByText("opus")).toBeInTheDocument();
  });

  it("should render the empty state when the window has no data", async () => {
    const screen = await render(
      <UsagePeriodClient comparisons={comparisons} modelDisplayNames={{}} />,
      { wrapper: withNuqsTestingAdapter({ searchParams: "?period=90" }) },
    );

    await expect
      .element(screen.getByText("No activity yet."))
      .toBeInTheDocument();
  });
});
