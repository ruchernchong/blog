import { render } from "vitest-browser-react";
import FeaturedPosts from "@/app/(main)/blog/components/featured-posts";
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
  seriesId: null,
  seriesOrder: null,
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
  it("should render featured posts with title", async () => {
    const screen = await render(<FeaturedPosts featuredPosts={mockPosts} />);
    await expect
      .element(screen.getByText("Featured Posts"))
      .toBeInTheDocument();
  });

  it("should render only the first 3 posts when more than 3 are provided", async () => {
    const screen = await render(<FeaturedPosts featuredPosts={mockPosts} />);
    await expect.element(screen.getByText("first post")).toBeInTheDocument();
    await expect.element(screen.getByText("second post")).toBeInTheDocument();
    await expect.element(screen.getByText("third post")).toBeInTheDocument();
    await expect
      .element(screen.getByText("fourth post"))
      .not.toBeInTheDocument();
  });

  it("should render empty when no posts are provided", async () => {
    const screen = await render(<FeaturedPosts featuredPosts={[]} />);
    await expect
      .element(screen.getByText("Featured Posts"))
      .toBeInTheDocument();
    await expect.element(screen.getByRole("link")).not.toBeInTheDocument();
  });
});
