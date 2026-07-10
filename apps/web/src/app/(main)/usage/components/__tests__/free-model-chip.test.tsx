import { render, screen } from "@testing-library/react";
import type { Cost } from "@workspace/usage/types";
import { FreeModelChip } from "../free-model-chip";

function renderChip(viewId: string, cost: Cost) {
  return render(<FreeModelChip cost={cost} viewId={viewId} />);
}

describe("FreeModelChip", () => {
  it("should display Free for a model with an exact zero cost", () => {
    renderChip("model", 0);

    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("should not display Free for positive or unpriced model costs", () => {
    for (const cost of [0.001, null]) {
      const view = renderChip("model", cost);

      expect(screen.queryByText("Free")).not.toBeInTheDocument();
      view.unmount();
    }
  });

  it("should not display Free outside the model view", () => {
    for (const viewId of ["provider", "agent"]) {
      const view = renderChip(viewId, 0);

      expect(screen.queryByText("Free")).not.toBeInTheDocument();
      view.unmount();
    }
  });
});
