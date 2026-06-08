import { Chip } from "@heroui/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  getFeaturedPosts,
  getPublishedPostsForGrid,
} from "@/lib/queries/posts";
import { getPublishedSeriesWithPosts } from "@/lib/queries/series";

async function FeaturedPostBlock() {
  const featuredPosts = await getFeaturedPosts();
  const post = featuredPosts[0];

  if (!post?.publishedAt) return null;

  const formattedDate = format(post.publishedAt, "dd MMMM yyyy");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-muted text-sm uppercase tracking-widest">
        Featured
      </h2>
      <Link
        href={post.metadata.canonical as Route}
        className="group block rounded-2xl border border-border bg-background p-6 transition-colors hover:bg-default"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Chip color="accent" size="sm" variant="soft">
            Featured
          </Chip>
          <time
            dateTime={formatISO(post.publishedAt)}
            className="text-muted text-sm"
          >
            {formattedDate}
          </time>
        </div>
        <h3 className="mb-2 font-bold text-foreground text-xl capitalize transition-colors group-hover:text-accent">
          {post.title}
        </h3>
        {post.summary && (
          <p className="line-clamp-3 text-muted text-sm leading-relaxed">
            {post.summary}
          </p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 text-muted text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </div>
  );
}

async function SeriesBlock() {
  const series = await getPublishedSeriesWithPosts();

  if (series.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-muted text-sm uppercase tracking-widest">
        Series
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {series.map((s) => (
          <Link
            key={s.slug}
            href={`/minimal/blog?series=${s.slug}` as Route}
            className="flex min-w-[200px] flex-col gap-2 rounded-2xl border border-border bg-background p-5 transition-colors hover:bg-default"
          >
            <span className="line-clamp-2 font-semibold text-foreground text-sm">
              {s.title}
            </span>
            <span className="text-muted text-xs">{s.posts.length} parts</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function AllPostsList() {
  const posts = await getPublishedPostsForGrid();

  if (posts.length === 0) {
    return <p className="text-muted text-sm">No posts found.</p>;
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
      {posts.map((post) => {
        if (!post.publishedAt) return null;

        const formattedDate = format(post.publishedAt, "dd MMM yyyy");

        return (
          <Link
            key={post.id}
            href={`/minimal/blog/${post.slug}` as Route}
            className="group flex items-start justify-between gap-4 bg-background p-5 transition-colors hover:bg-default"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="font-semibold text-foreground capitalize transition-colors group-hover:text-accent">
                {post.title}
              </span>
              {post.summary && (
                <span className="line-clamp-2 text-muted text-sm leading-relaxed">
                  {post.summary}
                </span>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <time
                  dateTime={formatISO(post.publishedAt)}
                  className="text-muted text-xs"
                >
                  {formattedDate}
                </time>
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2 py-0 text-muted text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <span className="shrink-0 text-muted text-sm">
              {post.metadata.readingTime}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function MinimalBlogPage() {
  return (
    <div className="flex flex-col gap-12 py-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-bold text-4xl text-foreground tracking-tight md:text-5xl">
          Writing.
        </h1>
        <p className="max-w-xl text-lg text-muted leading-relaxed">
          Posts on engineering, technology, and shipping side projects.
        </p>
      </div>

      <Suspense>
        <FeaturedPostBlock />
      </Suspense>

      <Suspense>
        <SeriesBlock />
      </Suspense>

      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-muted text-sm uppercase tracking-widest">
          All Posts
        </h2>
        <Suspense>
          <AllPostsList />
        </Suspense>
      </div>
    </div>
  );
}
