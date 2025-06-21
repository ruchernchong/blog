import { render, screen } from "@testing-library/react";
import FeaturedPosts from "../featured-posts";
import type { Post } from "contentlayer/generated";

const mockPosts: Post[] = [
  {
    title: "first post",
    canonical: "/posts/first-post",
    excerpt: "This is the first post excerpt",
    publishedAt: "2024-01-01T00:00:00Z",
  } as Post,
  {
    title: "second post",
    canonical: "/posts/second-post",
    excerpt: "This is the second post excerpt",
    publishedAt: "2024-01-02T00:00:00Z",
  } as Post,
  {
    title: "third post",
    canonical: "/posts/third-post",
    excerpt: "This is the third post excerpt",
    publishedAt: "2024-01-03T00:00:00Z",
  } as Post,
  {
    title: "fourth post",
    canonical: "/posts/fourth-post",
    excerpt: "This is the fourth post excerpt",
    publishedAt: "2024-01-04T00:00:00Z",
  } as Post,
];

describe("FeaturedPosts", () => {
  it("renders featured posts with title", () => {
    render(<FeaturedPosts featuredPosts={mockPosts} />);
    expect(screen.getByText("Featured Posts")).toBeInTheDocument();
  });

  it("renders only first 3 posts when more than 3 provided", () => {
    render(<FeaturedPosts featuredPosts={mockPosts} />);
    expect(screen.getByText("first post")).toBeInTheDocument();
    expect(screen.getByText("second post")).toBeInTheDocument();
    expect(screen.getByText("third post")).toBeInTheDocument();
    expect(screen.queryByText("fourth post")).not.toBeInTheDocument();
  });

  it("renders empty when no posts provided", () => {
    render(<FeaturedPosts featuredPosts={[]} />);
    expect(screen.getByText("Featured Posts")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
