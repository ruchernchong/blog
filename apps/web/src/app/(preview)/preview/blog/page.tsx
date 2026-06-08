import { Chip } from "@heroui/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import {
  getFeaturedPosts,
  getPublishedPostsForGrid,
} from "@/lib/queries/posts";
import { getPublishedSeriesWithPosts } from "@/lib/queries/series";

export default async function PreviewBlogPage() {
  const [featuredPosts, gridPosts, seriesList] = await Promise.all([
    getFeaturedPosts(),
    getPublishedPostsForGrid(),
    getPublishedSeriesWithPosts(),
  ]);
  const featuredPost = featuredPosts[0] ?? null;

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-border/50 border-b py-16 md:py-24">
        <h1 className="font-semibold text-[clamp(3rem,8vw,6rem)] leading-none tracking-tighter">
          Writing.
        </h1>
        <p className="mt-6 max-w-xl text-muted text-xl leading-relaxed">
          My blog posts on coding, tech, and random thoughts.
        </p>
      </div>

      {/* Featured post */}
      {featuredPost && featuredPost.publishedAt && (
        <section className="border-border/50 border-b py-12">
          <Link
            href={`/blog/${featuredPost.slug}` as Route}
            className="group block overflow-hidden rounded-2xl bg-surface p-8 shadow-[var(--surface-shadow)] transition-shadow hover:shadow-md md:p-10"
          >
            <Chip size="sm" variant="soft" color="accent">
              Featured
            </Chip>
            <h2 className="mt-4 mb-3 font-semibold text-2xl tracking-tight transition-colors group-hover:text-accent md:text-3xl">
              {featuredPost.title}
            </h2>
            {featuredPost.summary && (
              <p className="mb-6 line-clamp-3 text-muted leading-relaxed">
                {featuredPost.summary}
              </p>
            )}
            <div className="flex items-center justify-between text-muted text-sm">
              <time dateTime={formatISO(featuredPost.publishedAt)}>
                {format(featuredPost.publishedAt, "dd MMM yyyy")}
              </time>
              <span>{featuredPost.metadata?.readingTime}</span>
            </div>
          </Link>
        </section>
      )}

      {/* Series */}
      {seriesList.length > 0 && (
        <section className="border-border/50 border-b py-12">
          <h2 className="mb-8 font-semibold text-2xl tracking-tight">Series</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {seriesList.map((s) => (
              <Link
                key={s.id}
                href={`/blog/series/${s.slug}` as Route}
                className="shrink-0 rounded-xl bg-default px-5 py-3 transition-colors hover:bg-default/80"
              >
                <div className="font-medium text-foreground text-sm">
                  {s.title}
                </div>
                <div className="mt-0.5 text-muted text-xs">
                  {s.postCount} posts
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All posts */}
      <section className="py-12">
        <h2 className="mb-8 font-semibold text-2xl tracking-tight">
          All Posts
        </h2>
        <div>
          {gridPosts.map((post) => {
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
                <div className="flex shrink-0 flex-col items-end gap-0.5 text-muted text-sm">
                  <time dateTime={formatISO(post.publishedAt)}>
                    {format(post.publishedAt, "dd MMM yyyy")}
                  </time>
                  <span>{post.metadata?.readingTime}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
