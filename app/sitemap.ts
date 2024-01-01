import { allDocuments } from "contentlayer/generated";
import { BASE_URL, navLinks } from "@/config";

const sitemap = async () => {
  const pages = navLinks
    .filter(({ href }) => href !== "/")
    .map(({ href }) => href);

  return [
    {
      url: BASE_URL,
      lastModified: formatLastModified(),
      changeFrequency: "yearly",
      priority: 1.0,
    },
    ...pages.map((url) => ({
      url: `${BASE_URL}${url}`,
      lastModified: formatLastModified(),
      changeFrequency: "yearly",
      priority: 1.0,
    })),
    ...allDocuments.map(({ publishedAt, url }) => ({
      url: `${BASE_URL}${url}`,
      lastModified: formatLastModified(publishedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    })),
  ];
};

const formatLastModified = (datetime?: Date | string) => {
  if (typeof datetime === "string") {
    datetime = new Date(datetime).toISOString().split("T")[0];
  }

  if (!datetime) {
    datetime = new Date().toISOString().split("T")[0];
  }

  return datetime;
};

export default sitemap;
