import { MetadataRoute } from "next";
import { HOST_URL } from "@/config";
import { sanityClient } from "@/lib/sanity-server";
import { postsQuery } from "@/lib/queries";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const pages = ["/about", "/random-musings", "/projects"];
  const posts = await sanityClient.fetch(postsQuery);
  const randomMusings = await fetch(
    "https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json"
  ).then((res) => res.json());

  return [
    {
      url: HOST_URL,
      lastModified: formatLastModified(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...pages.map((page) => ({
      url: `${HOST_URL}${page}`,
      lastModified: formatLastModified(),
      changeFrequency: "monthly",
      priority: 0.8,
    })),
    ...posts.map(({ publishedDate, slug }) => ({
      url: `${HOST_URL}/blog/${slug}`,
      lastModified: formatLastModified(publishedDate),
      changeFrequency: "daily",
      priority: 0.5,
    })),
    ...randomMusings.map(({ date, slug }) => ({
      url: `${HOST_URL}/random-musings/${slug}`,
      lastModified: formatLastModified(date),
      changeFrequency: "daily",
      priority: 0.5,
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
