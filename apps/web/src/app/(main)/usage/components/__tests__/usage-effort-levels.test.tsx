import type { EffortSummary } from "@workspace/usage/types";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { UsageEffortLevels } from "../usage-effort-levels";

const classified: EffortSummary = {
  levels: [
    { level: "low", sessionCount: 1 },
    { level: "high", sessionCount: 3 },
  ],
  classifiedSessionCount: 4,
  unclassifiedSessionCount: 2,
};

const allClassified: EffortSummary = {
  levels: [{ level: "medium", sessionCount: 5 }],
  classifiedSessionCount: 5,
  unclassifiedSessionCount: 0,
};

describe("UsageEffortLevels", () => {
  it("should render classified caption and level rows", async () => {
    const screen = await render(<UsageEffortLevels effort={classified} />);

    await expect
      .element(screen.getByText("4 of 6 sessions classified."))
      .toBeInTheDocument();
    await expect.element(screen.getByText("Low")).toBeInTheDocument();
    await expect.element(screen.getByText("High")).toBeInTheDocument();
    await expect.element(screen.getByText("1 (25%)")).toBeInTheDocument();
    await expect.element(screen.getByText("3 (75%)")).toBeInTheDocument();
  });

  it("should render the all-classified caption", async () => {
    const screen = await render(<UsageEffortLevels effort={allClassified} />);

    await expect
      .element(screen.getByText("All 5 sessions classified."))
      .toBeInTheDocument();
    await expect.element(screen.getByText("Medium")).toBeInTheDocument();
  });
});
