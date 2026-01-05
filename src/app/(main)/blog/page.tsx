import { Notebook02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import type { Metadata, Route } from "next";
import Link from "next/link";
// import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { FeaturedPost } from "@/app/(main)/blog/_components/featured-post";
import { SeriesCards } from "@/app/(main)/blog/_components/series-cards";
// import { TagFilter } from "@/app/(main)/blog/_components/tag-filter";
// import { loadSearchParams } from "@/app/(main)/blog/search-params";
import { PageTitle } from "@/components/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getFeaturedPosts,
  getPublishedPostsForGrid,
} from "@/lib/queries/posts";
import { getPublishedSeriesWithPosts } from "@/lib/queries/series";
import { getPopularPosts } from "@/lib/services/popular-posts";
import { getAllViewCounts } from "@/lib/services/post-stats";

export const metadata: Metadata = {
  title: "Blog",
  description: "My blog posts on coding, tech, and random thoughts.",
};

async function FeaturedPostContent() {
  const [popularPosts, featuredPosts, viewCounts] = await Promise.all([
    getPopularPosts(1),
    getFeaturedPosts(),
    getAllViewCounts(),
  ]);

  // Prefer explicitly featured post, fallback to most popular
  const featuredPost = featuredPosts[0] ?? popularPosts[0];

  if (!featuredPost) {
    return null;
  }

  return (
    <FeaturedPost
      post={featuredPost}
      views={viewCounts.get(featuredPost.slug) ?? 0}
    />
  );
}

async function SeriesCardsContent() {
  const publishedSeries = await getPublishedSeriesWithPosts();

  if (publishedSeries.length === 0) {
    return null;
  }

  return <SeriesCards series={publishedSeries} />;
}

async function PostGrid() {
  const [gridPosts, viewCounts] = await Promise.all([
    getPublishedPostsForGrid(),
    getAllViewCounts(),
  ]);

  if (gridPosts.length === 0) {
    return (
      <p className="col-span-full text-center text-muted-foreground">
        No posts found.
      </p>
    );
  }

  return (
    <>
      {gridPosts.map((post) => {
        if (!post.publishedAt) return null;

        const formattedDate = format(post.publishedAt, "dd MMM yyyy");

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
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={2} />
                    <span className="text-sm">
                      {formatViews(viewCounts.get(post.slug) ?? 0)}
                    </span>
                  </div>
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
    </>
  );
}

export default function BlogPage() {
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
        <Suspense>
          <FeaturedPostContent />
        </Suspense>

        <Suspense>
          <SeriesCardsContent />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Suspense>
            <PostGrid />
          </Suspense>
        </div>
      </div>
    </>
  );
}

function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return views.toLocaleString();
}
