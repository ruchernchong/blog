import { Skeleton } from "@heroui/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getPublishedPostsForGrid } from "@/lib/queries/posts";

const POST_FALLBACKS = ["first-post", "second-post", "third-post"] as const;

interface PostGridProps {
  tag?: string;
}

export function PostGrid({ tag }: PostGridProps) {
  return (
    <Suspense fallback={<PostGridFallback />}>
      <PostGridContent tag={tag} />
    </Suspense>
  );
}

export function PostGridFallback() {
  return (
    <section
      role="status"
      aria-label="Loading blog posts"
      className="flex flex-col"
    >
      <Skeleton className="mb-4 h-6 w-28 rounded-lg" />
      {POST_FALLBACKS.map((post) => (
        <div
          key={post}
          aria-hidden="true"
          className="flex flex-col gap-1.5 border-separator border-t py-4"
        >
          <Skeleton className="h-5 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
      ))}
    </section>
  );
}

async function PostGridContent({ tag }: PostGridProps) {
  const gridPosts = await getPublishedPostsForGrid(tag);

  return (
    <section className="flex flex-col">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-semibold text-xl tracking-tight">
          {tag ? `Tagged “${tag}”` : "All Posts"}
        </h2>
        {tag && (
          <Link
            href={"/blog" as Route}
            className="font-medium text-muted text-sm transition-colors hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </div>

      {gridPosts.length === 0 ? (
        <p className="text-muted">No posts found.</p>
      ) : (
        gridPosts.map((post) => {
          if (!post.publishedAt) return null;

          const formattedDate = format(post.publishedAt, "dd MMM yyyy");

          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}` as Route}
              className="flex flex-col gap-1.5 border-separator border-t py-4 transition-transform hover:translate-x-1.5"
            >
              <span className="font-semibold capitalize">{post.title}</span>
              <span className="font-mono text-muted text-sm">
                <time dateTime={formatISO(post.publishedAt)}>
                  {formattedDate}
                </time>
              </span>
            </Link>
          );
        })
      )}
    </section>
  );
}
