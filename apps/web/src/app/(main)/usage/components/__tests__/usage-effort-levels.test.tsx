import { render, screen } from "@testing-library/react";
import type { EffortSummary } from "@workspace/usage/types";
import { describe, expect, it } from "vitest";
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
  it("should render classified caption and level rows", () => {
    render(<UsageEffortLevels effort={classified} />);

    expect(screen.getByText("4 of 6 sessions classified.")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("1 (25%)")).toBeInTheDocument();
    expect(screen.getByText("3 (75%)")).toBeInTheDocument();
  });

  it("should render the all-classified caption", () => {
    render(<UsageEffortLevels effort={allClassified} />);

    expect(screen.getByText("All 5 sessions classified.")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });
});
