import { format, formatISO } from "date-fns";
import type { Metadata, Route } from "next";
import Link from "next/link";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { FeaturedPost } from "@/app/(blog)/blog/_components/featured-post";
import { TagFilter } from "@/app/(blog)/blog/_components/tag-filter";
import { blogSearchParamsCache } from "@/app/(blog)/blog/search-params";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { PageTitle } from "@/components/shared/page-title";
import { Badge } from "@/components/ui/badge";
import { getFeaturedPosts, getPublishedPosts } from "@/lib/queries/posts";
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
  const { tag } = await blogSearchParamsCache.parse(searchParams);

  const [publishedPosts, popularPosts, tags] = await Promise.all([
    getPublishedPosts(),
    popularPostsService.getPopularPosts(1),
    getUniqueTags(),
  ]);

  const featuredPosts = await getFeaturedPosts();

  // Prefer explicitly featured post, fallback to most popular
  const featuredPost = featuredPosts[0] ?? popularPosts[0];

  // Filter posts by tag if provided
  const filteredPosts = tag
    ? publishedPosts.filter((post) => post.tags.includes(tag))
    : publishedPosts;

  // Exclude featured post from the grid when showing all posts
  const gridPosts = tag
    ? filteredPosts
    : filteredPosts.filter((post) => !post.featured);

  return (
    <>
      <PageTitle
        title="Blog"
        description="My blog posts on coding, tech, and random thoughts."
        className="mb-8"
      />

      <div className="flex flex-col gap-8">
        {/* Featured Post - only show when no tag filter */}
        {featuredPost && !tag && <FeaturedPost post={featuredPost} />}

        {/* Tag Filter */}
        <Suspense fallback={null}>
          <TagFilter tags={tags} />
        </Suspense>

        {/* Post Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gridPosts.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              No posts found{tag && ` for "${tag}"`}.
            </p>
          )}
          {gridPosts.map((post) => {
            if (!post.publishedAt) return null;

            const formattedDate = format(post.publishedAt, "dd MMM yyyy");

            return (
              <Card key={post.id} className="flex flex-col">
                <Link
                  href={post.metadata.canonical as Route}
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
                        {post.metadata.readingTime}
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
