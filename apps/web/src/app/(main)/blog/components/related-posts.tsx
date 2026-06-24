import { Card } from "@heroui/react";
import { format, formatISO } from "date-fns";
import Link from "next/link";
import { AnnotationRail } from "@/components/annotation-rail";
import { Eyebrow } from "@/components/eyebrow";
import { getRelatedPosts } from "@/lib/services/related-posts";

interface RelatedPostsProps {
  slug: string;
}

export const RelatedPosts = async ({ slug }: RelatedPostsProps) => {
  const relatedPosts = await getRelatedPosts(slug, 4);

  if (!relatedPosts.length) return null;

  return (
    <section className="not-prose flex flex-col gap-6">
      <Eyebrow>Related</Eyebrow>
      <div className="grid gap-4 md:grid-cols-2">
        {relatedPosts.map((post) => {
          if (!post.publishedAt) return null;

          return (
            <Card key={post.slug} variant="transparent">
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-2"
              >
                <h3 className="font-display font-medium text-foreground text-lg group-hover:text-accent">
                  {post.title}
                </h3>
                {post.summary && (
                  <p className="line-clamp-2 text-muted text-sm leading-relaxed">
                    {post.summary}
                  </p>
                )}
                <AnnotationRail>
                  <time dateTime={formatISO(post.publishedAt)}>
                    {format(post.publishedAt, "dd MMM yyyy")}
                  </time>
                  <span>
                    {post.commonTagCount}{" "}
                    {post.commonTagCount === 1 ? "tag" : "tags"}
                  </span>
                </AnnotationRail>
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
