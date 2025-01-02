import { BASE_URL, navLinks } from "@/config";
import { allDocuments } from "contentlayer/generated";
import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => {
  return [
    { url: BASE_URL, lastModified: formatLastModified() },
    ...navLinks
      .filter(({ href }) => href !== "/")
      .map(({ href }) => ({
        url: `${BASE_URL}${href}`,
        lastModified: formatLastModified(),
      })),
    ...allDocuments
      .filter(({ isDraft }) => !isDraft)
      .map(({ publishedAt, canonical }) => ({
        url: canonical,
        lastModified: formatLastModified(publishedAt),
        changeFrequency: "daily",
      })),
  ];
};

const formatLastModified = (datetime: Date | string = new Date()): string =>
  new Date(datetime).toISOString().split("T")[0];

export default sitemap;
