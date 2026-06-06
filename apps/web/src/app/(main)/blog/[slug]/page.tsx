import {
  Book01Icon,
  Calendar01Icon,
  File01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Mdx } from "@/app/(main)/blog/components/mdx";
import { RelatedPosts } from "@/app/(main)/blog/components/related-posts";
import { ScrollProgress } from "@/app/(main)/blog/components/scroll-progress";
import { StatsBar } from "@/app/(main)/blog/components/stats-bar";
import { StructuredData } from "@/app/components/structured-data";
import { Typography } from "@/components/typography";
import {
  getPublishedPostBySlug,
  getPublishedPostSlugs,
} from "@/lib/queries/posts";

interface TocItem {
  id: string;
  level: number;
  text: string;
}

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

function getPostToc(content: string): TocItem[] {
  const headingPattern = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match = headingPattern.exec(content);

  while (match) {
    const [, hashes, rawText] = match;
    const text = rawText
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[{}]/g, "")
      .trim();

    if (text) {
      headings.push({
        id: text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-"),
        level: hashes.length,
        text,
      });
    }

    match = headingPattern.exec(content);
  }

  return headings;
}

function removeMatchingLeadingTitle(content: string, title: string): string {
  const [firstLine, ...remainingLines] = content.split("\n");
  const firstHeading = firstLine?.match(/^#\s+(.+)$/);

  if (firstHeading?.[1]?.trim().toLowerCase() !== title.trim().toLowerCase()) {
    return content;
  }

  return remainingLines.join("\n").trimStart();
}

function PostToc({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="not-prose hidden lg:block">
      <div className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-surface">
        <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
          <HugeiconsIcon icon={File01Icon} size={16} strokeWidth={2} />
          On this page
        </div>
        <nav className="flex flex-col gap-1" aria-label="Table of contents">
          {headings.map((heading) => (
            <a
              className="rounded-lg px-3 py-2 text-muted text-sm transition-colors hover:bg-default/60 hover:text-foreground"
              href={`#${heading.id}`}
              key={`${heading.id}-${heading.level}`}
              style={{
                paddingLeft: heading.level === 3 ? "1.5rem" : undefined,
              }}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function MobilePostToc({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <details className="not-prose rounded-2xl border border-border bg-surface p-4 shadow-surface lg:hidden">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold text-foreground text-sm">
        <HugeiconsIcon icon={File01Icon} size={16} strokeWidth={2} />
        On this page
      </summary>
      <nav className="mt-3 flex flex-col gap-1" aria-label="Table of contents">
        {headings.map((heading) => (
          <a
            className="rounded-lg px-3 py-2 text-muted text-sm transition-colors hover:bg-default/60 hover:text-foreground"
            href={`#${heading.id}`}
            key={`${heading.id}-${heading.level}`}
            style={{ paddingLeft: heading.level === 3 ? "1.5rem" : undefined }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </details>
  );
}

async function PostContent({ slug }: { slug: string }) {
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  const formattedDate = post.publishedAt
    ? format(post.publishedAt, "dd MMM yyyy")
    : "";
  const content = removeMatchingLeadingTitle(post.content, post.title);
  const tocItems = getPostToc(content);

  return (
    <>
      <ScrollProgress />
      <StructuredData data={post.metadata.structuredData} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="prose mb-16 flex min-w-0 max-w-none flex-col gap-12 prose-img:rounded-2xl prose-a:text-foreground prose-a:underline">
          <div className="flex flex-col items-center gap-4 text-center">
            <StatsBar slug={post.slug} />
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-muted">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Calendar01Icon}
                  size={20}
                  strokeWidth={2}
                />
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
          <aside className="relative rounded-2xl border border-border bg-default p-6 shadow-surface">
            <div className="absolute top-0 left-6 -translate-y-1/2 rounded-full bg-background p-2 text-foreground">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={24}
                strokeWidth={2}
              />
            </div>
            {post.summary}
          </aside>
          <MobilePostToc headings={tocItems} />
          <Suspense
            fallback={<div className="animate-pulse">Loading content...</div>}
          >
            <CachedMdx content={content} slug={slug} />
          </Suspense>
          <RelatedPosts slug={post.slug} />
        </article>
        <PostToc headings={tocItems} />
      </div>
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
