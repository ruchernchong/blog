import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/queries/posts";

export async function LatestWriting() {
  const allPosts = await getPublishedPosts();
  const latestPosts = allPosts.slice(0, 3);

  return (
    <section className="flex flex-col">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-semibold text-xl tracking-tight">Latest Writing</h2>
        <Link
          href="/blog"
          className="font-medium text-muted text-sm transition-colors hover:text-foreground"
        >
          Read the blog →
        </Link>
      </div>
      {latestPosts.map((post) => {
        if (!post.publishedAt) {
          return null;
        }

        return (
          <Link
            key={post.slug}
            href={post.metadata.canonical as Route}
            className="flex flex-col gap-1.5 border-separator border-t py-4 transition-transform hover:translate-x-1.5"
          >
            <span className="font-semibold">{post.title}</span>
            <span className="text-muted text-sm">
              <time dateTime={formatISO(post.publishedAt)}>
                {format(post.publishedAt, "dd MMM yyyy")}
              </time>
              {post.metadata.readingTime && ` · ${post.metadata.readingTime}`}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
