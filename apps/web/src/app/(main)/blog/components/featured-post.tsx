import { Chip, Skeleton } from "@heroui/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Typography } from "@/components/typography";
import { getFeaturedPosts } from "@/lib/queries/posts";

// import { ViewIcon } from "@hugeicons/core-free-icons";
// import { HugeiconsIcon } from "@hugeicons/react";
// import { getPopularPosts } from "@/lib/services/popular-posts";
// import { getAllViewCounts } from "@/lib/services/post-stats";

// TODO: Re-enable when view count display is restored.
// function formatViews(views: number): string {
//   if (views >= 1000) {
//     return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
//   }
//   return views.toLocaleString();
// }

export function FeaturedPost() {
  return (
    <Suspense fallback={<FeaturedPostFallback />}>
      <FeaturedPostContent />
    </Suspense>
  );
}

export function FeaturedPostFallback() {
  return (
    <div
      role="status"
      aria-label="Loading featured post"
      className="rounded-2xl border border-border bg-surface p-6 md:p-8"
    >
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-4/5 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

async function FeaturedPostContent() {
  const featuredPosts = await getFeaturedPosts();
  // TODO: Re-enable popular fallback and visible view counts after caching Redis reads for /blog.
  // const [popularPosts, featuredPosts, viewCounts] = await Promise.all([
  //   getPopularPosts(1),
  //   getFeaturedPosts(),
  //   getAllViewCounts(),
  // ]);

  // Prefer explicitly featured post, fallback to most popular
  const post = featuredPosts[0];
  // const post = featuredPosts[0] ?? popularPosts[0];

  if (!post?.publishedAt) {
    return null;
  }

  // const views = viewCounts.get(post.slug) ?? 0;
  const formattedDate = format(post.publishedAt, "dd MMMM yyyy");

  return (
    <Link
      href={post.metadata.canonical as Route}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-lg md:p-8"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color="accent" variant="primary">
            Featured
          </Chip>
          <time
            dateTime={formatISO(post.publishedAt)}
            title={formattedDate}
            className="text-muted text-sm"
          >
            {formattedDate}
          </time>
          {/* TODO: Re-enable view count display after caching Redis reads for /blog. */}
          {/* <div className="flex items-center gap-2 text-muted">
            <span>·</span>
            <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={2} />
            <span className="text-sm">{formatViews(views)}</span>
          </div> */}
        </div>

        <Typography variant="h2" className="line-clamp-2 capitalize">
          {post.title}
        </Typography>

        {post.summary && (
          <Typography variant="body" className="line-clamp-3 text-muted">
            {post.summary}
          </Typography>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} size="sm" variant="secondary">
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
