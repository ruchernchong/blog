import { Chip } from "@heroui/react";
import { ItemCard } from "@heroui-pro/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { getPublishedPostsForGrid } from "@/lib/queries/posts";

// import { ViewIcon } from "@hugeicons/core-free-icons";
// import { HugeiconsIcon } from "@hugeicons/react";
// import { getAllViewCounts } from "@/lib/services/post-stats";

// TODO: Re-enable when view count display is restored.
// function formatViews(views: number): string {
//   if (views >= 1000) {
//     return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
//   }
//
//   return views.toLocaleString();
// }

export async function PostGrid() {
  const gridPosts = await getPublishedPostsForGrid();
  // TODO: Re-enable visible view counts after caching Redis reads for /blog.
  // const [gridPosts, viewCounts] = await Promise.all([
  //   getPublishedPostsForGrid(),
  //   getAllViewCounts(),
  // ]);

  if (gridPosts.length === 0) {
    return (
      <p className="col-span-full text-center text-muted">No posts found.</p>
    );
  }

  return (
    <>
      {gridPosts.map((post) => {
        if (!post.publishedAt) return null;

        const formattedDate = format(post.publishedAt, "dd MMM yyyy");

        return (
          <ItemCard className="h-full" key={post.id}>
            <Link
              href={`/blog/${post.slug}` as Route}
              className="flex h-full flex-col"
            >
              <ItemCard.Content className="flex flex-1 flex-col gap-4">
                <div className="flex items-center justify-between gap-2 text-muted text-sm">
                  <time
                    dateTime={formatISO(post.publishedAt)}
                    title={formattedDate}
                  >
                    {formattedDate}
                  </time>
                  {/* TODO: Re-enable view count display after caching Redis reads for /blog. */}
                  {/* <div className="flex items-center gap-2 text-muted">
                    <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={2} />
                    <span className="text-sm">
                      {formatViews(viewCounts.get(post.slug) ?? 0)}
                    </span>
                  </div> */}
                  <span>{post.metadata.readingTime}</span>
                </div>
                <ItemCard.Title className="line-clamp-2 capitalize">
                  {post.title}
                </ItemCard.Title>
                <ItemCard.Description className="line-clamp-3 flex-1">
                  {post.summary}
                </ItemCard.Description>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 2).map((postTag) => {
                      return (
                        <Chip
                          key={postTag}
                          size="sm"
                          variant="soft"
                          className="text-xs"
                        >
                          {postTag}
                        </Chip>
                      );
                    })}
                  </div>
                )}
              </ItemCard.Content>
            </Link>
          </ItemCard>
        );
      })}
    </>
  );
}
