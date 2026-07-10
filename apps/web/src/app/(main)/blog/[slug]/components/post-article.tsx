import { Skeleton } from "@heroui/react";
import {
  Book01Icon,
  Calendar01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
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
import { Typography } from "@/components/typography";
import { getPublishedPostBySlug } from "@/lib/queries/posts";

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
    <article
      role="status"
      aria-label="Loading article"
      className="prose mx-auto mb-16 flex max-w-4xl flex-col gap-12"
    >
      <div aria-hidden="true" className="flex flex-col gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-4/5 rounded-xl" />
        </div>
        <div className="flex flex-col gap-2 rounded-md border-l-4 border-l-border bg-default p-6">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
        </div>
        <PostBodyFallback />
      </div>
    </article>
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
      <article className="prose mx-auto mb-16 flex max-w-4xl flex-col gap-12 prose-img:rounded-2xl prose-a:text-foreground prose-a:underline">
        <div className="flex flex-col items-center gap-4 text-center">
          <StatsBar slug={post.slug} />
          <div className="flex flex-wrap items-center justify-center gap-2 text-muted">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} size={20} strokeWidth={2} />
              {post.publishedAt && (
                <time
                  className="whitespace-nowrap"
                  dateTime={formatISO(post.publishedAt)}
                  title={formattedDate}
                >
                  {formattedDate}
                </time>
              )}
            </div>
            <span>&middot;</span>
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Book01Icon} size={20} strokeWidth={2} />
              <span className="whitespace-nowrap">
                {post.metadata.readingTime}
              </span>
            </div>
          </div>
          <Typography variant="h1">{post.title}</Typography>
        </div>
        <aside className="relative rounded-md border-l-4 border-l-border bg-default p-6">
          <div className="absolute top-0 left-0 -translate-x-[50%] -translate-y-[50%] rounded-full bg-background p-2 text-foreground">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={32}
              strokeWidth={2}
            />
          </div>
          {post.summary}
        </aside>
        <PostBody content={post.content} slug={slug} />
        <RelatedPosts slug={post.slug} />
      </article>
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
