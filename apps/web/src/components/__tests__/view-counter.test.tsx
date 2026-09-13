import { render } from "vitest-browser-react";
import { ViewCounter } from "@/app/(main)/blog/components/view-counter";

vi.mock("@/app/_actions/stats", () => ({
  incrementViews: vi.fn(() => Promise.resolve({ views: 42 })),
}));

describe("ViewCounter", () => {
  it("should render view count", async () => {
    const component = await ViewCounter({ slug: "test-post" });
    const screen = await render(component);
    await expect.element(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render in a proper container", async () => {
    const component = await ViewCounter({ slug: "test-post" });
    const screen = await render(component);
    const viewCount = screen.getByText("42");
    await expect.element(viewCount).toBeInTheDocument();
    expect(viewCount.element().closest("div")).not.toBeNull();
  });
});
