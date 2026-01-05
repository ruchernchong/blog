import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Typography } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import type { PostMetadata } from "@/schema/posts";

function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return views.toLocaleString();
}

interface FeaturedPostData {
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: Date | null;
  metadata: PostMetadata;
  tags?: string[];
}

interface FeaturedPostProps {
  post: FeaturedPostData;
  views?: number;
}

export function FeaturedPost({ post, views = 0 }: FeaturedPostProps) {
  if (!post.publishedAt) return null;

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
