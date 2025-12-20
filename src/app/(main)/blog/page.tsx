import { Notebook02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import type { Metadata, Route } from "next";
import Link from "next/link";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import readingTime from "reading-time";
import { FeaturedPost } from "@/app/(main)/blog/_components/featured-post";
import { SeriesCards } from "@/app/(main)/blog/_components/series-cards";
import { SeriesFilter } from "@/app/(main)/blog/_components/series-filter";
import { TagFilter } from "@/app/(main)/blog/_components/tag-filter";
import { blogSearchParamsCache } from "@/app/(main)/blog/search-params";
import { PageTitle } from "@/components/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeaturedPosts, getPublishedPosts } from "@/lib/queries/posts";
import { getPublishedSeriesWithPostCount } from "@/lib/queries/series";
import { popularPostsService } from "@/lib/services";
import { getUniqueTags } from "@/lib/tags";

export const metadata: Metadata = {
  title: "Blog",
  description: "My blog posts on coding, tech, and random thoughts.",
};

interface BlogPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag, series } = await blogSearchParamsCache.parse(searchParams);

  const [publishedPosts, popularPosts, tags, publishedSeries] =
    await Promise.all([
      getPublishedPosts(),
      popularPostsService.getPopularPosts(1),
      getUniqueTags(),
      getPublishedSeriesWithPostCount(),
    ]);

  const featuredPosts = await getFeaturedPosts();

  // Prefer explicitly featured post, fallback to most popular
  const featuredPost = featuredPosts[0] ?? popularPosts[0];

  // Find the active series for display
  const activeSeries = series
    ? publishedSeries.find((item) => item.slug === series)
    : undefined;

  // Filter posts by series and/or tag
  let filteredPosts = publishedPosts;
  if (series) {
    filteredPosts = filteredPosts.filter((post) => {
      const postSeries = publishedSeries.find(
        (item) => item.id === post.seriesId,
      );
      return postSeries?.slug === series;
    });
  }
  if (tag) {
    filteredPosts = filteredPosts.filter((post) => post.tags.includes(tag));
  }

  // Exclude featured post from the grid when showing all posts (no filters)
  const hasFilters = tag || series;
  const gridPosts = hasFilters
    ? filteredPosts
    : filteredPosts.filter((post) => !post.featured);

  return (
    <>
      <PageTitle
        title="Blog"
        description="My blog posts on coding, tech, and random thoughts."
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <HugeiconsIcon
              icon={Notebook02Icon}
              size={20}
              className="text-primary"
            />
          </div>
        }
        className="mb-8"
      />

      <div className="flex flex-col gap-8">
        {/* Featured Post - only show when no filters active */}
        {featuredPost && !hasFilters && <FeaturedPost post={featuredPost} />}

        {/* Series Cards - show when no series filter is active */}
        {!series && publishedSeries.length > 0 && (
          <Suspense fallback={null}>
            <SeriesCards series={publishedSeries} />
          </Suspense>
        )}

        {/* Series Filter - show when series filter is active */}
        {series && (
          <Suspense fallback={null}>
            <SeriesFilter seriesTitle={activeSeries?.title} />
          </Suspense>
        )}

        {/* Tag Filter */}
        <Suspense fallback={null}>
          <TagFilter tags={tags} />
        </Suspense>

        {/* Post Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gridPosts.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              No posts found
              {series && ` in "${activeSeries?.title ?? series}"`}
              {tag && ` for "${tag}"`}.
            </p>
          )}
          {gridPosts.map((post) => {
            if (!post.publishedAt) return null;

            const formattedDate = format(post.publishedAt, "dd MMM yyyy");
            const readTime = readingTime(post.content).text;

            return (
              <Card key={post.id} className="flex flex-col">
                <Link
                  href={`/blog/${post.slug}` as Route}
                  className="flex h-full flex-col"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <time
                        dateTime={formatISO(post.publishedAt)}
                        title={formattedDate}
                        className="text-muted-foreground text-sm"
                      >
                        {formattedDate}
                      </time>
                      <span className="text-muted-foreground text-sm">
                        {readTime}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 capitalize">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <p className="line-clamp-2 flex-1 text-muted-foreground">
                      {post.summary}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 2).map((postTag) => {
                          return (
                            <Badge
                              key={postTag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {postTag}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
