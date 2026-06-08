import { format } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/queries/posts";

export async function AppleLatestPosts() {
  const allPosts = await getPublishedPosts();
  const posts = allPosts.slice(0, 3);

  return (
    <section className="border-border/50 border-t py-12">
      <div className="mb-10 flex items-baseline justify-between">
        <h2 className="font-semibold text-4xl tracking-tight">
          Recent Writing
        </h2>
        <Link
          href={"/preview/blog" as Route}
          className="text-muted text-sm transition-colors hover:text-accent"
        >
          See all →
        </Link>
      </div>
      <div>
        {posts.map((post) => {
          if (!post.publishedAt) return null;
          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}` as Route}
              className="group flex items-start justify-between gap-6 border-border/30 border-b py-5 transition-colors last:border-0 hover:text-accent"
            >
              <div className="min-w-0">
                <span className="line-clamp-1 font-medium text-foreground transition-colors group-hover:text-accent">
                  {post.title}
                </span>
                {post.summary && (
                  <p className="mt-0.5 line-clamp-1 text-muted text-sm">
                    {post.summary}
                  </p>
                )}
              </div>
              <time className="shrink-0 text-muted text-sm">
                {format(post.publishedAt, "dd MMM yyyy")}
              </time>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
