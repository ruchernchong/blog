import { Card, Skeleton } from "@heroui/react";
import { Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO } from "date-fns";
import Link from "next/link";
import { Suspense } from "react";
import { Typography } from "@/components/typography";
import { getRelatedPosts } from "@/lib/services/related-posts";

const RELATED_POST_FALLBACKS = ["first-post", "second-post"] as const;

interface RelatedPostsProps {
  slug: string;
}

export function RelatedPosts({ slug }: RelatedPostsProps) {
  return (
    <Suspense fallback={<RelatedPostsFallback />}>
      <RelatedPostsContent slug={slug} />
    </Suspense>
  );
}

export function RelatedPostsFallback() {
  return (
    <div
      role="status"
      aria-label="Loading related articles"
      className="not-prose flex flex-col gap-8"
    >
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          {RELATED_POST_FALLBACKS.map((post) => (
            <Card key={post}>
              <Card.Header className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-16 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-4/5 rounded-lg" />
              </Card.Header>
              <Card.Content>
                <Skeleton className="h-4 w-full rounded-lg" />
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

async function RelatedPostsContent({ slug }: RelatedPostsProps) {
  const relatedPosts = await getRelatedPosts(slug, 4);

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
                <Card.Header>
                  <div className="flex items-center justify-between gap-4">
                    <time
                      dateTime={formatISO(post.publishedAt)}
                      title={formattedDate}
                      className="text-muted text-sm"
                    >
                      {formattedDate}
                    </time>
                    <div className="flex items-center gap-2 text-muted text-sm">
                      <HugeiconsIcon
                        icon={Tag01Icon}
                        size={16}
                        strokeWidth={2}
                      />
                      <span>
                        {post.commonTagCount}{" "}
                        {post.commonTagCount === 1 ? "tag" : "tags"}
                      </span>
                    </div>
                  </div>
                  <Card.Title className="capitalize">{post.title}</Card.Title>
                </Card.Header>
                <Card.Content>{post.summary}</Card.Content>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
