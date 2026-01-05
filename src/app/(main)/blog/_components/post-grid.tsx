import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedPostsForGrid } from "@/lib/queries/posts";
import { getAllViewCounts } from "@/lib/services/post-stats";

function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return views.toLocaleString();
}

export async function PostGrid() {
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
