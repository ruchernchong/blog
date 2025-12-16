import { render, screen } from "@testing-library/react";
import { ViewCounter } from "@/app/(blog)/blog/_components/view-counter";

vi.mock("@/app/(blog)/_actions/stats", () => ({
  incrementViews: vi.fn(() => Promise.resolve({ views: 42 })),
}));

describe("ViewCounter", () => {
  it("renders view count", async () => {
    const component = await ViewCounter({ slug: "test-post" });
    render(component);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders in proper container", async () => {
    const component = await ViewCounter({ slug: "test-post" });
    render(component);
    const viewCount = screen.getByText("42");
    expect(viewCount.closest("div")).toBeInTheDocument();
  });
});
