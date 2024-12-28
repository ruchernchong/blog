import RSS from "rss";
import { NextResponse } from "next/server";
import { allDocuments } from "contentlayer/generated";
import { BASE_URL } from "@/config";

export const GET = () => {
  const feed = new RSS({
    title: "Ru Chern",
    site_url: BASE_URL,
    feed_url: `${BASE_URL}/feed.xml`,
  });

  allDocuments.map(({ title, publishedAt, excerpt, url }) =>
    feed.item({
      title,
      url: `${BASE_URL}${url}`,
      date: publishedAt as string,
      description: excerpt || title,
    }),
  );

  return new NextResponse(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1200, stale-while-revalidate=600",
    },
  });
};
