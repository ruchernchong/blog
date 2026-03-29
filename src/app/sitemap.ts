import type { MetadataRoute } from "next";
import { BASE_URL, navLinks } from "@/config";
import projects from "@/data/projects";
import { getPublishedPosts } from "@/lib/queries/posts";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
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
};

const formatLastModified = (datetime: Date | string = new Date()): string =>
  new Date(datetime).toISOString().split("T")[0];

export default sitemap;
