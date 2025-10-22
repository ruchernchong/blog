import { NextResponse } from "next/server";
import RSS from "rss";
import { BASE_URL } from "@/config";
import { db, posts } from "@/schema";
import { eq, desc } from "drizzle-orm";

export const GET = async () => {
  const publishedPosts = await db
    .select({
      title: posts.title,
      publishedAt: posts.publishedAt,
      summary: posts.summary,
      metadata: posts.metadata,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));

  const feed = new RSS({
    title: "Ru Chern",
    site_url: BASE_URL,
    feed_url: `${BASE_URL}/feed.xml`,
  });

  publishedPosts.forEach((post) => {
    feed.item({
      title: post.title,
      url: post.metadata.canonical,
      date: post.publishedAt || new Date(),
      description: post.summary ?? post.title,
    });
  });

  return new NextResponse(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1200, stale-while-revalidate=600",
    },
  });
};
