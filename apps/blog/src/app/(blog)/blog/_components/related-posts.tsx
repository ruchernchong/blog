import { Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { Typography } from "@/components/typography";
import { relatedPostsCalculator } from "@/lib/services";

interface RelatedPostsProps {
  slug: string;
}

export const RelatedPosts = async ({ slug }: RelatedPostsProps) => {
  const relatedPosts = await relatedPostsCalculator.getRelatedPosts(slug, 4);

  if (!relatedPosts.length) return null;

  return (
    <div className="not-prose flex flex-col gap-8">
      <Typography variant="h2">Related Articles</Typography>
      <div className="grid gap-4 md:grid-cols-2">
        {relatedPosts.map((post) => {
          if (!post.publishedAt) return null;

          const formattedDate = format(post.publishedAt, "dd MMM yyyy");

          return (
            <Card key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="flex h-full flex-col"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <time
                      dateTime={formatISO(post.publishedAt)}
                      title={formattedDate}
                      className="text-sm text-muted-foreground"
                    >
                      {formattedDate}
                    </time>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <HugeiconsIcon icon={Tag01Icon} size={16} strokeWidth={2} />
                      <span>
                        {post.commonTagCount}{" "}
                        {post.commonTagCount === 1 ? "tag" : "tags"}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="capitalize">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>{post.summary}</CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
