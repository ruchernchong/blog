import type { MetadataRoute } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { allDocuments } from "contentlayer/generated";
import { BASE_URL, navLinks } from "@/config";

const sitemap = (): MetadataRoute.Sitemap => {
  noStore();

  return [
    {
      url: BASE_URL,
      lastModified: formatLastModified(),
    },
    ...navLinks
      .filter(({ href }) => href !== "/")
      .map(({ href }) => ({
        url: `${BASE_URL}${href}`,
        lastModified: formatLastModified(),
      })),
    ...allDocuments.map(({ publishedAt, url }) => ({
      url: `${BASE_URL}${url}`,
      lastModified: formatLastModified(publishedAt),
    })),
  ];
};

const formatLastModified = (datetime: Date | string = new Date()): string =>
  new Date(datetime).toISOString().split("T")[0];

export default sitemap;
