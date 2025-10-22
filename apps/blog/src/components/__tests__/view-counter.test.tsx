import { render, screen } from "@testing-library/react";
import { ViewCounter } from "@/app/(blog)/blog/_components/view-counter";

vi.mock("@/app/(blog)/actions/stats", () => ({
  incrementViews: vi.fn(() => Promise.resolve({ views: 42 })),
}));

describe("ViewCounter", () => {
  it("renders view count", async () => {
    render(await ViewCounter({ slug: "test-post" }));
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders in proper container", async () => {
    render(await ViewCounter({ slug: "test-post" }));
    const viewCount = screen.getByText("42");
    expect(viewCount.closest("div")).toBeInTheDocument();
  });
});
