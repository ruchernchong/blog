import { format, formatISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import type { Metadata } from "next";
import { db, posts } from "@/schema";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Blog",
  description: "My blog posts on coding, tech, and random thoughts.",
};

const BlogPage = async () => {
  const publishedPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));

  return (
    <>
      <PageTitle
        title="Blog"
        description="My blog posts on coding, tech, and random thoughts."
        className="mb-8"
      />
      <div className="flex flex-col gap-4">
        {publishedPosts.length > 0 &&
          publishedPosts.map((post) => {
            if (!post.publishedAt) return null;

            const formattedDate = format(post.publishedAt, "iiii, dd MMMM yyyy");

            return (
              <Card key={post.id}>
                <Link href={post.metadata.canonical} className="flex h-full flex-col">
                  <CardHeader>
                    <time
                      dateTime={formatISO(post.publishedAt)}
                      title={formattedDate}
                      className="text-sm text-zinc-400 italic"
                    >
                      {formattedDate}
                    </time>
                    <CardTitle className="capitalize">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>{post.summary}</CardContent>
                </Link>
              </Card>
            );
          })}
      </div>
    </>
  );
};

export default BlogPage;
