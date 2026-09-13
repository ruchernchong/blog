import type { Cost } from "@workspace/usage/types";
import { render } from "vitest-browser-react";
import { FreeModelChip } from "../free-model-chip";

function renderChip(viewId: string, cost: Cost) {
  return render(<FreeModelChip cost={cost} viewId={viewId} />);
}

describe("FreeModelChip", () => {
  it("should display Free for a model with an exact zero cost", async () => {
    const screen = await renderChip("model", 0);

    await expect.element(screen.getByText("Free")).toBeInTheDocument();
  });

  it("should not display Free for positive or unpriced model costs", async () => {
    for (const cost of [0.001, null]) {
      const screen = await renderChip("model", cost);

      await expect.element(screen.getByText("Free")).not.toBeInTheDocument();
      await screen.unmount();
    }
  });

  it("should not display Free outside the model view", async () => {
    for (const viewId of ["provider", "agent"]) {
      const screen = await renderChip(viewId, 0);

      await expect.element(screen.getByText("Free")).not.toBeInTheDocument();
      await screen.unmount();
    }
  });
});
