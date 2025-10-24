import { and, eq, isNull } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { BASE_URL, navLinks } from "@/config";
import projects from "@/data/projects";
import { db, posts } from "@/schema";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const publishedPosts = await db
    .select({
      publishedAt: posts.publishedAt,
      metadata: posts.metadata,
    })
    .from(posts)
    .where(and(eq(posts.status, "published"), isNull(posts.deletedAt)));

  return [
    { url: BASE_URL, lastModified: formatLastModified() },
    ...navLinks
      .filter(({ href }) => href !== "/")
      .map(({ href }) => ({
        url: `${BASE_URL}${href}`,
        lastModified: formatLastModified(),
      })),
    ...projects.map(({ slug }) => ({
      url: `${BASE_URL}/projects/${slug}`,
      lastModified: formatLastModified(),
    })),
    ...publishedPosts.map((post) => ({
      url: post.metadata.canonical,
      lastModified: formatLastModified(post.publishedAt || new Date()),
      changeFrequency: "daily" as const,
    })),
  ];
};

const formatLastModified = (datetime: Date | string = new Date()): string =>
  new Date(datetime).toISOString().split("T")[0];

export default sitemap;
