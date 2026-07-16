import { Skeleton } from "@heroui/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getRelatedPosts } from "@/lib/services/related-posts";

const RELATED_POST_FALLBACKS = ["first-post", "second-post"] as const;

interface RelatedPostsProps {
  slug: string;
}

export function RelatedPosts({ slug }: RelatedPostsProps) {
  return (
    <Suspense fallback={<RelatedPostsFallback />}>
      <RelatedPostsContent slug={slug} />
    </Suspense>
  );
}

export function RelatedPostsFallback() {
  return (
    <section
      role="status"
      aria-label="Loading related articles"
      className="not-prose flex flex-col"
    >
      <Skeleton className="mb-4 h-6 w-36 rounded-lg" />
      {RELATED_POST_FALLBACKS.map((post) => (
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

async function RelatedPostsContent({ slug }: RelatedPostsProps) {
  const relatedPosts = await getRelatedPosts(slug, 4);

  if (!relatedPosts.length) return null;

  return (
    <section className="not-prose flex flex-col">
      <h2 className="mb-4 font-semibold text-xl tracking-tight">
        Related posts
      </h2>
      {relatedPosts.map((post) => {
        if (!post.publishedAt) return null;

        const formattedDate = format(post.publishedAt, "dd MMM yyyy");

        return (
          <Link
            key={post.slug}
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
      })}
    </section>
  );
}
