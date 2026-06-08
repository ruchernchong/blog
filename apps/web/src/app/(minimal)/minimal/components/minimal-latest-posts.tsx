import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/queries/posts";

export async function MinimalLatestPosts() {
  const allPosts = await getPublishedPosts();
  const latestPosts = allPosts.slice(0, 3);

  if (latestPosts.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold text-2xl text-foreground tracking-tight">
          Latest Writing.
        </h2>
        <Link
          href="/minimal/blog"
          className="text-muted text-sm transition-colors hover:text-foreground"
        >
          View all →
        </Link>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {latestPosts.map((post) => {
          if (!post.publishedAt) return null;

          const formattedDate = format(post.publishedAt, "dd MMM yyyy");

          return (
            <Link
              key={post.slug}
              href={post.metadata.canonical as Route}
              className="group flex items-start justify-between gap-4 bg-background p-5 transition-colors hover:bg-default"
            >
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-foreground transition-colors group-hover:text-accent">
                  {post.title}
                </span>
                {post.summary && (
                  <span className="line-clamp-2 text-muted text-sm leading-relaxed">
                    {post.summary}
                  </span>
                )}
                <time
                  dateTime={formatISO(post.publishedAt)}
                  className="text-muted text-xs"
                >
                  {formattedDate}
                </time>
              </div>
              <span className="shrink-0 text-muted text-sm">
                {post.metadata.readingTime}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
