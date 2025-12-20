import { render, screen } from "@testing-library/react";
import FeaturedPosts from "@/app/(main)/blog/_components/featured-posts";
import type { PostMetadata, SelectPost } from "@/schema";

const createMockPost = (
  id: string,
  index: number,
  name: string,
): SelectPost => ({
  id,
  slug: `${name}-post`,
  title: `${name} post`,
  summary: `This is the ${name} post excerpt`,
  content: "Mock content",
  status: "published" as const,
  tags: [],
  featured: true,
  coverImage: null,
  authorId: null,
  publishedAt: new Date(`2024-01-0${index}T00:00:00Z`),
  createdAt: new Date(`2024-01-0${index}T00:00:00Z`),
  updatedAt: new Date(`2024-01-0${index}T00:00:00Z`),
  deletedAt: null,
  metadata: {
    readingTime: "1 min read",
    description: `This is the ${name} post excerpt`,
    canonical: `/posts/${name}-post`,
    openGraph: {
      title: `${name} post`,
      siteName: "Test Site",
      description: `This is the ${name} post excerpt`,
      type: "article",
      publishedTime: `2024-01-0${index}T00:00:00Z`,
      url: `/posts/${name}-post`,
      locale: "en_SG",
    },
    twitter: {
      card: "summary_large_image",
      site: "@test",
      title: `${name} post`,
      description: `This is the ${name} post excerpt`,
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: `${name} post`,
      dateModified: `2024-01-0${index}T00:00:00Z`,
      datePublished: `2024-01-0${index}T00:00:00Z`,
      description: `This is the ${name} post excerpt`,
      url: `/posts/${name}-post`,
      author: {
        "@type": "Person",
        name: "Test Author",
        url: "https://example.com",
      },
    },
  } satisfies PostMetadata,
});

const mockPosts: SelectPost[] = [
  createMockPost("1", 1, "first"),
  createMockPost("2", 2, "second"),
  createMockPost("3", 3, "third"),
  createMockPost("4", 4, "fourth"),
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
