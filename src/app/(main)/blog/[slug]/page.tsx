import {
  Book01Icon,
  Calendar01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, cacheSignal } from "react";
import { StructuredData } from "@/app/_components/structured-data";
import StatsBar from "@/app/(main)/analytics/_components/stats-bar";
import { Mdx } from "@/app/(main)/blog/_components/mdx";
import { RelatedPosts } from "@/app/(main)/blog/_components/related-posts";
import { ScrollProgress } from "@/app/(main)/blog/_components/scroll-progress";
import { SeriesNavigation } from "@/app/(main)/blog/_components/series-navigation";
import { Typography } from "@/components/typography";
import {
  getPublishedPostBySlug,
  getPublishedPostSlugs,
} from "@/lib/queries/posts";
import { getPublishedPostsInSeries, getSeriesById } from "@/lib/queries/series";

type Params = Promise<{ slug: string }>;

// Cached post fetching with cacheSignal for cleanup
const getPost = cache(async (slug: string) => {
  const signal = cacheSignal();

  // Fetch post using query function
  const post = await getPublishedPostBySlug(slug);

  // Listen for cache expiration to perform cleanup if needed
  if (signal) {
    signal.addEventListener("abort", () => {
      // Cache lifetime ended - cleanup resources if needed
      console.log(`[cacheSignal] Cache expired for post: ${slug}`);
    });
  }

  if (!post) {
    return;
  }

  // TODO: Interim solution to use the opengraph images from the generated ones
  delete post.metadata.openGraph.images;
  delete post.metadata.twitter.images;

  return post;
});

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const params = await props.params;
  const post = await getPost(params.slug);

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

export default async function PostPage(props: { params: Params }) {
  const params = await props.params;
  // Use cached getPost - deduplicates with generateMetadata call
  const post = await getPost(params.slug);

  if (!post || !post.publishedAt) {
    return notFound();
  }

  const formattedDate = format(post.publishedAt, "dd MMM yyyy");

  // Fetch series data if post belongs to a series
  let seriesData = null;
  if (post.seriesId) {
    const [series, seriesPosts] = await Promise.all([
      getSeriesById(post.seriesId),
      getPublishedPostsInSeries(post.seriesId),
    ]);

    if (series && seriesPosts.length > 0) {
      const currentIndex = seriesPosts.findIndex((p) => p.slug === post.slug);
      if (currentIndex !== -1) {
        seriesData = {
          title: series.title,
          slug: series.slug,
          currentPosition: currentIndex + 1,
          totalPosts: seriesPosts.length,
          previousPost:
            currentIndex > 0
              ? {
                  slug: seriesPosts[currentIndex - 1].slug,
                  title: seriesPosts[currentIndex - 1].title,
                }
              : null,
          nextPost:
            currentIndex < seriesPosts.length - 1
              ? {
                  slug: seriesPosts[currentIndex + 1].slug,
                  title: seriesPosts[currentIndex + 1].title,
                }
              : null,
        };
      }
    }
  }

  return (
    <>
      <ScrollProgress />
      <StructuredData data={post.metadata.structuredData} />
      <article className="prose mx-auto mb-16 flex max-w-4xl flex-col gap-12 prose-img:rounded-2xl prose-a:text-foreground prose-a:underline">
        <div className="flex flex-col items-center gap-4 text-center">
          <StatsBar slug={post.slug} />
          {seriesData && (
            <SeriesNavigation
              seriesTitle={seriesData.title}
              seriesSlug={seriesData.slug}
              currentPosition={seriesData.currentPosition}
              totalPosts={seriesData.totalPosts}
              previousPost={seriesData.previousPost}
              nextPost={seriesData.nextPost}
            />
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-muted-foreground">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} size={20} strokeWidth={2} />
              <time
                className="whitespace-nowrap"
                dateTime={formatISO(post.publishedAt)}
                title={formattedDate}
              >
                {formattedDate}
              </time>
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
        <aside className="relative rounded-md border-l-4 border-l-border bg-muted p-6">
          <div className="absolute top-0 left-0 -translate-x-[50%] -translate-y-[50%] rounded-full bg-background p-2 text-foreground">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={32}
              strokeWidth={2}
            />
          </div>
          {post.summary}
        </aside>
        <div>
          <Mdx content={post.content} />
        </div>
        <RelatedPosts slug={post.slug} />
      </article>
    </>
  );
}
