import { and, desc, eq, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { NextResponse } from "next/server";
import RSS from "rss";
import { BASE_URL } from "@/config";
import { db, posts } from "@/schema";

async function getFeedXml() {
  "use cache";
  cacheTag("posts:list");
  cacheLife("max");

  const publishedPosts = await db
    .select({
      title: posts.title,
      publishedAt: posts.publishedAt,
      summary: posts.summary,
      slug: posts.slug,
    })
    .from(posts)
    .where(and(eq(posts.status, "published"), isNull(posts.deletedAt)))
    .orderBy(desc(posts.publishedAt));

  const feed = new RSS({
    title: "Ru Chern",
    site_url: BASE_URL,
    feed_url: `${BASE_URL}/feed.xml`,
  });

  publishedPosts.forEach((post) => {
    feed.item({
      title: post.title,
      url: `${BASE_URL}/blog/${post.slug}`,
      date: post.publishedAt?.toISOString() || new Date().toISOString(),
      description: post.summary ?? post.title,
    });
  });

  return feed.xml({ indent: true });
}

export async function GET() {
  const xml = await getFeedXml();

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1200, stale-while-revalidate=600",
    },
  });
}
