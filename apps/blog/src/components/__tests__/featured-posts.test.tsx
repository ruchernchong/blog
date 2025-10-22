import { render, screen } from "@testing-library/react";
import FeaturedPosts from "../featured-posts";
import type { SelectPost } from "@/schema";

const mockPosts: SelectPost[] = [
  {
    id: "1",
    slug: "first-post",
    title: "first post",
    summary: "This is the first post excerpt",
    content: "Mock content",
    status: "published" as const,
    tags: [],
    featured: true,
    coverImage: null,
    publishedAt: new Date("2024-01-01T00:00:00Z"),
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    metadata: {
      readingTime: "1 min read",
      description: "This is the first post excerpt",
      canonical: "/posts/first-post",
      openGraph: {} as any,
      twitter: {} as any,
      structuredData: {} as any,
    },
  },
  {
    id: "2",
    slug: "second-post",
    title: "second post",
    summary: "This is the second post excerpt",
    content: "Mock content",
    status: "published" as const,
    tags: [],
    featured: true,
    coverImage: null,
    publishedAt: new Date("2024-01-02T00:00:00Z"),
    createdAt: new Date("2024-01-02T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
    metadata: {
      readingTime: "1 min read",
      description: "This is the second post excerpt",
      canonical: "/posts/second-post",
      openGraph: {} as any,
      twitter: {} as any,
      structuredData: {} as any,
    },
  },
  {
    id: "3",
    slug: "third-post",
    title: "third post",
    summary: "This is the third post excerpt",
    content: "Mock content",
    status: "published" as const,
    tags: [],
    featured: true,
    coverImage: null,
    publishedAt: new Date("2024-01-03T00:00:00Z"),
    createdAt: new Date("2024-01-03T00:00:00Z"),
    updatedAt: new Date("2024-01-03T00:00:00Z"),
    metadata: {
      readingTime: "1 min read",
      description: "This is the third post excerpt",
      canonical: "/posts/third-post",
      openGraph: {} as any,
      twitter: {} as any,
      structuredData: {} as any,
    },
  },
  {
    id: "4",
    slug: "fourth-post",
    title: "fourth post",
    summary: "This is the fourth post excerpt",
    content: "Mock content",
    status: "published" as const,
    tags: [],
    featured: true,
    coverImage: null,
    publishedAt: new Date("2024-01-04T00:00:00Z"),
    createdAt: new Date("2024-01-04T00:00:00Z"),
    updatedAt: new Date("2024-01-04T00:00:00Z"),
    metadata: {
      readingTime: "1 min read",
      description: "This is the fourth post excerpt",
      canonical: "/posts/fourth-post",
      openGraph: {} as any,
      twitter: {} as any,
      structuredData: {} as any,
    },
  },
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
