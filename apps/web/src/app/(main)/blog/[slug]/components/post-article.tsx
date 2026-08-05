import { Skeleton } from "@heroui/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Mdx } from "@/app/(main)/blog/components/mdx";
import { RelatedPosts } from "@/app/(main)/blog/components/related-posts";
import { ScrollProgress } from "@/app/(main)/blog/components/scroll-progress";
import { StatsBar } from "@/app/(main)/blog/components/stats-bar";
import { StructuredData } from "@/app/components/structured-data";
import { SurfaceCard } from "@/app/components/surface-card";
import { getPublishedPostBySlug } from "@/lib/queries/posts";
import { PostToc } from "./post-toc.client";

/**
 * Content-shaped shell for Instant Navigations while params resolve and the
 * cached article streams in. Mirrors PostArticle layout (card + TOC column).
 */
export function PostArticleFallback() {
  return (
    <div
      role="status"
      aria-label="Loading post"
      className="mx-auto flex w-full max-w-[1200px] items-start justify-center gap-11"
    >
      <div aria-hidden="true" className="hidden w-53 shrink-0 lg:block" />
      <SurfaceCard className="flex min-w-0 flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-40 rounded-lg" />
          <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
          <Skeleton className="h-10 w-3/4 max-w-lg rounded-lg" />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-default/50 p-5">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-11/12 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-4/5 rounded-lg" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>
      </SurfaceCard>
      <aside aria-hidden="true" className="hidden w-53 shrink-0 lg:block">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
          <Skeleton className="h-3 w-5/6 rounded-lg" />
          <Skeleton className="h-3 w-4/5 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
        </div>
      </aside>
    </div>
  );
}

/**
 * The full article, cached and prerendered per slug so it lands in the static
 * HTML instead of streaming behind a skeleton. Keyed by `post:${slug}` and
 * `mdx:${slug}` so the existing invalidation (see cache-invalidation.ts) busts
 * it on publish/update. The page wraps this in Suspense with
 * {@link PostArticleFallback} so Instant Navigations can paint the shell while
 * params resolve; for slugs in generateStaticParams the cache fills at build
 * time, unknown slugs render on demand.
 */
export async function PostArticle({ slug }: { slug: string }) {
  "use cache";
  cacheLife("max");
  cacheTag(`post:${slug}`);
  cacheTag(`mdx:${slug}`);

  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? format(post.publishedAt, "dd MMM yyyy")
    : "";

  return (
    <>
      <ScrollProgress />
      <StructuredData data={post.metadata.structuredData} />
      <div className="mx-auto flex w-full max-w-[1200px] items-start justify-center gap-11">
        <div aria-hidden="true" className="hidden w-53 shrink-0 lg:block" />
        <SurfaceCard className="flex min-w-0 flex-col gap-8">
          <StatsBar slug={post.slug} />
          <div className="flex flex-col gap-4">
            <span className="font-mono text-muted text-sm">
              {post.publishedAt && (
                <time
                  dateTime={formatISO(post.publishedAt)}
                  title={formattedDate}
                >
                  {formattedDate}
                </time>
              )}
              {post.metadata.readingTime && ` · ${post.metadata.readingTime}`}
            </span>
            <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
              {post.title}
            </h1>
          </div>
          {post.summary && (
            <aside className="flex gap-3 rounded-xl border border-border bg-default/50 p-5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={16}
                  strokeWidth={2}
                />
              </span>
              <p className="text-muted leading-relaxed">{post.summary}</p>
            </aside>
          )}
          <div
            id="post-body"
            className="prose dark:prose-invert max-w-none prose-img:rounded-2xl prose-a:text-foreground prose-a:underline"
          >
            <Mdx content={post.content} />
          </div>
          <RelatedPosts slug={post.slug} />
        </SurfaceCard>
        <aside className="hidden w-53 shrink-0 lg:block">
          <PostToc />
        </aside>
      </div>
    </>
  );
}
