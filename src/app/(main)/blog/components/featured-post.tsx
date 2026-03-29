import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Typography } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { getFeaturedPosts } from "@/lib/queries/posts";
import { getPopularPosts } from "@/lib/services/popular-posts";
import { getAllViewCounts } from "@/lib/services/post-stats";

function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return views.toLocaleString();
}

export async function FeaturedPost() {
  const [popularPosts, featuredPosts, viewCounts] = await Promise.all([
    getPopularPosts(1),
    getFeaturedPosts(),
    getAllViewCounts(),
  ]);

  // Prefer explicitly featured post, fallback to most popular
  const post = featuredPosts[0] ?? popularPosts[0];

  if (!post || !post.publishedAt) {
    return null;
  }

  const views = viewCounts.get(post.slug) ?? 0;
  const formattedDate = format(post.publishedAt, "dd MMMM yyyy");

  return (
    <Link
      href={post.metadata.canonical as Route}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg md:p-8"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">Featured</Badge>
          <time
            dateTime={formatISO(post.publishedAt)}
            title={formattedDate}
            className="text-muted-foreground text-sm"
          >
            {formattedDate}
          </time>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>·</span>
            <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={2} />
            <span className="text-sm">{formatViews(views)}</span>
          </div>
        </div>

        <Typography variant="h2" className="line-clamp-2 capitalize">
          {post.title}
        </Typography>

        {post.summary && (
          <Typography
            variant="body"
            className="line-clamp-3 text-muted-foreground"
          >
            {post.summary}
          </Typography>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
