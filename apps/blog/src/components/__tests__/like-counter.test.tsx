import { fireEvent, render, screen } from "@testing-library/react";
import { LikeCounter } from "../like-counter";

vi.mock("@/app/(blog)/actions/stats", () => ({
  incrementLikes: vi.fn(() =>
    Promise.resolve({ totalLikes: 11, likesByUser: 1 }),
  ),
}));

vi.mock("@/config", () => ({
  MAX_LIKES_PER_USER: 10,
}));

const mockProps = {
  slug: "test-post",
  initialTotalLikes: 10,
  initialLikesByUser: 0,
};

describe("LikeCounter", () => {
  it("renders initial total likes", () => {
    render(<LikeCounter {...mockProps} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders initial likes with locale formatting", () => {
    render(<LikeCounter {...mockProps} initialTotalLikes={1234} />);
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("updates like count when button is clicked", async () => {
    render(<LikeCounter {...mockProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(screen.getByText("11")).toBeInTheDocument();
    });
  });

  it("renders like button component", () => {
    render(<LikeCounter {...mockProps} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has proper structure", () => {
    render(<LikeCounter {...mockProps} />);
    const container = screen.getByText("10").closest("div");
    expect(container).toBeInTheDocument();
  });
});
