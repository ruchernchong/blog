import { fireEvent, render, screen } from "@testing-library/react";
import LikeButton from "@/app/(blog)/blog/_components/like-button";

vi.mock("@/app/(blog)/_actions/stats", () => ({
  incrementLikes: vi.fn(() =>
    Promise.resolve({ totalLikes: 5, likesByUser: 1 }),
  ),
}));

vi.mock("@/config", () => ({
  MAX_LIKES_PER_USER: 10,
}));

const mockProps = {
  slug: "test-post",
  totalLikes: 4,
  likesByUser: 0,
  onLikeUpdateAction: vi.fn(),
};

describe("LikeButton", () => {
  it("renders outline heart icon when user hasn't liked", () => {
    render(<LikeButton {...mockProps} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("text-zinc-400");
  });

  it("renders solid heart icon when user has liked", () => {
    render(<LikeButton {...mockProps} likesByUser={1} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-pink-500");
  });

  it("calls onLikeUpdateAction when button is clicked", async () => {
    const mockOnLikeUpdate = vi.fn();
    render(<LikeButton {...mockProps} onLikeUpdateAction={mockOnLikeUpdate} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(mockOnLikeUpdate).toHaveBeenCalledWith({
        totalLikes: 5,
        likesByUser: 1,
      });
    });
  });

  it("does not increment when max likes reached", () => {
    render(<LikeButton {...mockProps} likesByUser={10} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockProps.onLikeUpdateAction).not.toHaveBeenCalled();
  });

  it("applies hover scale animation", () => {
    render(<LikeButton {...mockProps} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("hover:scale-110");
  });
});
