import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { UsageCacheSummary } from "./usage-cache-summary";

const tokenMix = {
  input: 100,
  output: 50,
  cacheRead: 300,
  cacheWrite: 100,
  reasoning: 0,
};

describe("UsageCacheSummary", () => {
  it("should show the hit rate, savings and labelled weekly columns", async () => {
    const screen = await render(
      <UsageCacheSummary
        cacheTrend={[
          { week: "2026-01-05", hitRate: 0.62, savings: 1200 },
          { week: "2026-01-12", hitRate: null, savings: null },
        ]}
        tokenMix={tokenMix}
      />,
    );

    await expect.element(screen.getByText("60%")).toBeInTheDocument();
    await expect.element(screen.getByText("US$1.2K")).toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Week of 5 Jan 2026: 62% cache hit"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Week of 12 Jan 2026: idle"))
      .toBeInTheDocument();
  });

  it("should fall back when nothing is cached or priced", async () => {
    const screen = await render(
      <UsageCacheSummary
        cacheTrend={[]}
        tokenMix={{ ...tokenMix, input: 0, cacheRead: 0, cacheWrite: 0 }}
      />,
    );

    await expect.element(screen.getByText("–")).toBeInTheDocument();
    await expect.element(screen.getByText("N.A.")).toBeInTheDocument();
  });
});
