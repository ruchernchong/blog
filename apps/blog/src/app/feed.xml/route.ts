import { allDocuments } from "contentlayer/generated";
import { NextResponse } from "next/server";
import RSS from "rss";
import { BASE_URL } from "@/config";

export const GET = () => {
  const feed = new RSS({
    title: "Ru Chern",
    site_url: BASE_URL,
    feed_url: `${BASE_URL}/feed.xml`,
  });

  allDocuments.map(({ title, publishedAt, excerpt, canonical }) =>
    feed.item({
      title,
      url: canonical,
      date: publishedAt,
      description: excerpt ?? title,
    }),
  );

  return new NextResponse(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1200, stale-while-revalidate=600",
    },
  });
};
