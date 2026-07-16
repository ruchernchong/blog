"use client";

import { format } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface GridPost {
  id: string;
  slug: string;
  title: string;
  /** ISO 8601 timestamp; serialised on the server for a clean client boundary. */
  publishedAt: string;
  featured: boolean;
  tags: string[];
}

interface PostGridListProps {
  posts: GridPost[];
  /** Active `?tag=` filter. Falsy → the default "All Posts" view. */
  activeTag?: string;
}

/**
 * Presentational post list. Pure (no hooks) so it can render both in the static
 * shell (as the Suspense fallback, with the default no-tag view) and inside the
 * client component below once the active tag is known.
 *
 * Filtering mirrors the previous server-side `getPublishedPostsForGrid`: the
 * default view hides the featured post (shown separately above), while a tag
 * filter shows every matching post.
 */
export function PostGridList({ posts, activeTag }: PostGridListProps) {
  const visible = activeTag
    ? posts.filter((post) => post.tags.includes(activeTag))
    : posts.filter((post) => !post.featured);

  return (
    <section className="flex flex-col">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-semibold text-xl tracking-tight">
          {activeTag ? `Tagged “${activeTag}”` : "All Posts"}
        </h2>
        {activeTag && (
          <Link
            href={"/blog" as Route}
            className="font-medium text-muted text-sm transition-colors hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted">No posts found.</p>
      ) : (
        visible.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}` as Route}
            className="flex flex-col gap-1.5 border-separator border-t py-4 transition-transform hover:translate-x-1.5"
          >
            <span className="font-semibold capitalize">{post.title}</span>
            <span className="font-mono text-muted text-sm">
              <time dateTime={post.publishedAt}>
                {format(new Date(post.publishedAt), "dd MMM yyyy")}
              </time>
            </span>
          </Link>
        ))
      )}
    </section>
  );
}

/**
 * Reads the active `?tag=` on the client so the grid can stay in the prerendered
 * shell. `useSearchParams` is null during prerender (see the Suspense fallback in
 * post-grid.tsx), then re-filters to the active tag after hydration.
 */
export function ActivePostGrid({
  posts,
}: Omit<PostGridListProps, "activeTag">) {
  const activeTag = useSearchParams().get("tag") ?? undefined;

  return <PostGridList posts={posts} activeTag={activeTag} />;
}
