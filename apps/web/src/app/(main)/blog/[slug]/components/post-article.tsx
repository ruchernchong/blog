import { Skeleton } from "@heroui/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Mdx } from "@/app/(main)/blog/components/mdx";
import { RelatedPosts } from "@/app/(main)/blog/components/related-posts";
import { ScrollProgress } from "@/app/(main)/blog/components/scroll-progress";
import { StatsBar } from "@/app/(main)/blog/components/stats-bar";
import { StructuredData } from "@/app/components/structured-data";
import { SurfaceCard } from "@/app/components/surface-card";
import { getPublishedPostBySlug } from "@/lib/queries/posts";
import { PostToc } from "./post-toc.client";

interface PostArticleProps {
  params: Promise<{ slug: string }>;
}

export function PostArticle({ params }: PostArticleProps) {
  return (
    <Suspense fallback={<PostArticleFallback />}>
      <PostArticleContent params={params} />
    </Suspense>
  );
}

export function PostArticleFallback() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] items-start justify-center gap-11">
      <div aria-hidden="true" className="hidden w-53 shrink-0 lg:block" />
      <SurfaceCard className="flex min-w-0 flex-col gap-8">
        <div
          role="status"
          aria-label="Loading article"
          className="flex flex-col gap-8"
        >
          <div aria-hidden="true" className="flex flex-col gap-6">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-10 w-4/5 rounded-xl" />
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-default/50 p-5">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
            </div>
            <PostBodyFallback />
          </div>
        </div>
      </SurfaceCard>
      <div aria-hidden="true" className="hidden w-53 shrink-0 lg:block" />
    </div>
  );
}

async function PostArticleContent({ params }: PostArticleProps) {
  const { slug } = await params;
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
            className="prose max-w-none prose-img:rounded-2xl prose-a:text-foreground prose-a:underline"
          >
            <PostBody content={post.content} slug={slug} />
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

function PostBody({ content, slug }: { content: string; slug: string }) {
  return (
    <Suspense fallback={<PostBodyFallback />}>
      <CachedMdx content={content} slug={slug} />
    </Suspense>
  );
}

export function PostBodyFallback() {
  return (
    <div role="status" aria-label="Loading article body">
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Skeleton className="h-5 w-full rounded-lg" />
        <Skeleton className="h-5 w-11/12 rounded-lg" />
        <Skeleton className="h-5 w-4/5 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-5 w-full rounded-lg" />
        <Skeleton className="h-5 w-3/4 rounded-lg" />
      </div>
    </div>
  );
}

async function CachedMdx({ content, slug }: { content: string; slug: string }) {
  "use cache";
  cacheTag(`mdx:${slug}`);
  cacheLife("max");

  return <Mdx content={content} />;
}
