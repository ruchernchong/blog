import { format, formatISO } from "date-fns";
import type { Metadata, Route } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Mdx } from "@/app/(main)/blog/components/mdx";
import { RelatedPosts } from "@/app/(main)/blog/components/related-posts";
import { ScrollProgress } from "@/app/(main)/blog/components/scroll-progress";
import { StatsBar } from "@/app/(main)/blog/components/stats-bar";
import { StructuredData } from "@/app/components/structured-data";
import { AnnotationRail } from "@/components/annotation-rail";
import {
  getPublishedPostBySlug,
  getPublishedPostSlugs,
} from "@/lib/queries/posts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getPost = async (slug: string) => {
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return;
  }

  // Return post with images removed from metadata (using generated OG images instead)
  return {
    ...post,
    metadata: {
      ...post.metadata,
      openGraph: { ...post.metadata.openGraph },
      twitter: { ...post.metadata.twitter },
    },
  };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return {
    title: post.title,
    description: post.metadata.description,
    openGraph: post.metadata.openGraph,
    twitter: post.metadata.twitter,
    alternates: {
      canonical: post.metadata.canonical,
    },
  };
}

export async function generateStaticParams() {
  const publishedPosts = await getPublishedPostSlugs();
  return publishedPosts.map(({ slug }) => ({ slug }));
}

// Cached MDX component to avoid re-compilation on each request
async function CachedMdx({ content, slug }: { content: string; slug: string }) {
  "use cache";
  cacheTag(`mdx:${slug}`);
  cacheLife("max");

  return <Mdx content={content} />;
}

async function PostContent({ slug }: { slug: string }) {
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  return (
    <>
      <ScrollProgress />
      <StructuredData data={post.metadata.structuredData} />
      <StatsBar slug={post.slug} />
      <article className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <h1 className="font-display font-semibold text-4xl text-foreground tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <AnnotationRail>
            {post.publishedAt && (
              <time dateTime={formatISO(post.publishedAt)}>
                {format(post.publishedAt, "dd MMM yyyy")}
              </time>
            )}
            {post.metadata.readingTime && (
              <span>{post.metadata.readingTime}</span>
            )}
            {post.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </AnnotationRail>
        </header>

        {post.summary && (
          <p className="border-accent border-l-2 pl-4 text-lg text-muted italic leading-relaxed">
            {post.summary}
          </p>
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none prose-img:rounded-lg prose-pre:font-mono prose-a:text-accent">
          <Suspense
            fallback={<div className="animate-pulse text-muted">Loading…</div>}
          >
            <CachedMdx content={post.content} slug={slug} />
          </Suspense>
        </div>

        <RelatedPosts slug={post.slug} />
      </article>
    </>
  );
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Suspense>
      <PostContent slug={slug} />
    </Suspense>
  );
}
