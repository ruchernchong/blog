import type { Route } from "next";
import { render } from "vitest-browser-react";
import BlogPost from "@/app/(main)/blog/components/blog-post";

const mockProps = {
  title: "test blog post",
  canonical: "/posts/test-blog-post" as Route,
  excerpt: "This is a test blog post excerpt",
  publishedAt: "2024-01-15T10:30:00Z",
};

describe("BlogPost", () => {
  it("should render blog post content", async () => {
    const screen = await render(<BlogPost {...mockProps} />);
    await expect
      .element(screen.getByText("test blog post"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("This is a test blog post excerpt"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Monday, 15 January 2024"))
      .toBeInTheDocument();
    await expect.element(screen.getByText("Read more")).toBeInTheDocument();
  });

  it("should render link with correct href", async () => {
    const screen = await render(<BlogPost {...mockProps} />);
    await expect
      .element(screen.getByRole("link"))
      .toHaveAttribute("href", "/posts/test-blog-post");
  });
});
