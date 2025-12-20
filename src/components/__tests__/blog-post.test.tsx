import { render, screen } from "@testing-library/react";
import type { Route } from "next";
import BlogPost from "@/app/(main)/blog/_components/blog-post";

const mockProps = {
  title: "test blog post",
  canonical: "/posts/test-blog-post" as Route,
  excerpt: "This is a test blog post excerpt",
  publishedAt: "2024-01-15T10:30:00Z",
};

describe("BlogPost", () => {
  it("renders blog post content", () => {
    render(<BlogPost {...mockProps} />);
    expect(screen.getByText("test blog post")).toBeInTheDocument();
    expect(
      screen.getByText("This is a test blog post excerpt"),
    ).toBeInTheDocument();
    expect(screen.getByText("Monday, 15 January 2024")).toBeInTheDocument();
    expect(screen.getByText("Read more")).toBeInTheDocument();
  });

  it("renders link with correct href", () => {
    render(<BlogPost {...mockProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/posts/test-blog-post");
  });
});
