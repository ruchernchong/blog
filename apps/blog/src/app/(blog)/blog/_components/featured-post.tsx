import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Typography } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import type { PostMetadata } from "@/schema/posts";

interface FeaturedPostData {
  title: string;
  summary: string | null;
  publishedAt: Date | null;
  metadata: PostMetadata;
  tags?: string[];
}

interface FeaturedPostProps {
  post: FeaturedPostData;
}

export const FeaturedPost = ({ post }: FeaturedPostProps) => {
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
          <span className="text-muted-foreground text-sm">
            · {post.metadata.readingTime}
          </span>
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
};
