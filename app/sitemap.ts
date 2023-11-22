import { MetadataRoute } from "next";
import { allDocuments } from "contentlayer/generated";
import { BASE_URL, navLinks } from "@/config";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const pages = navLinks
    .filter(({ href }) => href !== "/")
    .map(({ href }) => href);

  return [
    { url: BASE_URL, lastModified: formatLastModified() },
    ...pages.map((url) => ({
      url: `${BASE_URL}${url}`,
      lastModified: formatLastModified(),
    })),
    ...allDocuments.map(({ publishedAt, slug }) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: formatLastModified(publishedAt),
    })),
  ];
};

const formatLastModified = (datetime?: string | Date) => {
  if (typeof datetime === "string") {
    datetime = new Date(datetime).toISOString().split("T")[0];
  }

  if (!datetime) {
    datetime = new Date().toISOString().split("T")[0];
  }

  return datetime;
};

export default sitemap;
