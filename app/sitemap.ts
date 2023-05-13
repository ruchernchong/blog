import { HOST_URL } from "@/config";
import { Post, RandomMusing } from "@/lib/types";
import { sanityClient } from "@/lib/sanity-server";
import { postsQuery } from "@/lib/queries";
import { MetadataRoute } from "next";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const pages = ["", "about", "random-musings", "projects"];
  const posts: Post[] = await sanityClient.fetch(postsQuery);
  const randomMusings: RandomMusing[] = await fetch(
    "https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json",
    { cache: "no-store" }
  ).then((res) => res.json());

  return [
    ...pages.map((page) => ({
      url: `${HOST_URL}/${page}`,
      lastModified: formatLastModified(),
    })),
    ...posts.map(({ publishedDate, slug }) => ({
      url: `${HOST_URL}/blog/${slug}`,
      lastModified: formatLastModified(publishedDate),
    })),
    ...randomMusings.map(({ date, slug }) => ({
      url: `${HOST_URL}/random-musings/${slug}`,
      lastModified: formatLastModified(date),
    })),
  ];
};

const formatLastModified = (datetime?: string) => {
  if (!datetime) {
    datetime = new Date().toISOString();
  }

  return datetime.split("T")[0];
};

export default sitemap;
