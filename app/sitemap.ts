import { MetadataRoute } from "next";
import { allDocuments } from "contentlayer/generated";
import { HOST_URL, navLinks } from "@/config";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const pages = navLinks
    .filter(({ href }) => href !== "/")
    .map(({ href }) => href);

  return [
    { url: HOST_URL, lastModified: formatLastModified() },
    ...pages.map((url) => ({
      url: `${HOST_URL}${url}`,
      lastModified: formatLastModified(),
    })),
    ...allDocuments.map(({ publishedAt, slug }) => ({
      url: `${HOST_URL}/${slug}`,
      lastModified: formatLastModified(publishedAt),
    })),
  ];
};

const formatLastModified = (datetime?: string | Date) => {
  if (typeof datetime === "string") {
    datetime = new Date(datetime).toISOString();
  }

  if (!datetime) {
    datetime = new Date().toISOString();
  }

  return datetime;
};

export default sitemap;
