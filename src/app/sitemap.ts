import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { BASE_URL, navLinks } from "@/config";
import projects from "@/data/projects";
import { getPublishedPosts } from "@/lib/queries/posts";

function formatLastModified(datetime: Date | string = new Date()): string {
  return new Date(datetime).toISOString().split("T")[0];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("posts:list");
  cacheLife("max");

  const publishedPosts = await getPublishedPosts();

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
      url: `${BASE_URL}${post.metadata.canonical}`,
      lastModified: formatLastModified(post.publishedAt || new Date()),
      changeFrequency: "daily" as const,
    })),
  ];
}
