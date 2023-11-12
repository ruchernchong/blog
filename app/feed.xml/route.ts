import RSS from "rss";
import { NextResponse } from "next/server";
import { allDocuments } from "contentlayer/generated";
import { HOST_URL } from "@/config";

export const GET = () => {
  const feed = new RSS({
    title: "Ru Chern",
    site_url: HOST_URL,
    feed_url: `${HOST_URL}/feed.xml`,
  });

  allDocuments.map(({ title, slug, publishedAt, excerpt }) =>
    feed.item({
      title,
      url: `${HOST_URL}/${slug}`,
      date: publishedAt,
      description: excerpt || title,
    })
  );

  return new NextResponse(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1200, stale-while-revalidate=600",
    },
  });
};
