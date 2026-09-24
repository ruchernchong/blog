import { render } from "vitest-browser-react";
import { AnimatedCounter } from "@/app/components/home/animated-counter";

describe("AnimatedCounter", () => {
  it("should count up to the plain value", async () => {
    const screen = await render(<AnimatedCounter value={1234} />);

    await expect
      .element(screen.getByText((1234).toLocaleString()), { timeout: 3000 })
      .toBeInTheDocument();
  });

  it("should count up to the compact value", async () => {
    const screen = await render(<AnimatedCounter value={48200} compact />);

    await expect
      .element(screen.getByText("48.2k"), { timeout: 3000 })
      .toBeInTheDocument();
  });
});
