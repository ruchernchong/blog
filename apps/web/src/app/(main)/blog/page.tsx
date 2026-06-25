import { Card } from "@heroui/react";
import { format, formatISO } from "date-fns";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { AnnotationRail } from "@/components/annotation-rail";
import { Eyebrow } from "@/components/eyebrow";
import { PageHeader } from "@/components/page-header";
import {
  getFeaturedPosts,
  getPublishedPostsForGrid,
} from "@/lib/queries/posts";
import { getPublishedSeriesWithPosts } from "@/lib/queries/series";

const description =
  "Writing on engineering, technology, and shipping side projects.";

export const metadata: Metadata = {
  title: "Blog",
  description,
};

function PostMeta({
  publishedAt,
  readingTime,
  tags,
}: {
  publishedAt: Date | null;
  readingTime?: string;
  tags: string[];
}) {
  return (
    <AnnotationRail>
      {publishedAt && (
        <time dateTime={formatISO(publishedAt)}>
          {format(publishedAt, "dd MMM yyyy")}
        </time>
      )}
      {readingTime && <span>{readingTime}</span>}
      {tags.slice(0, 3).map((tag) => (
        <span key={tag}>#{tag}</span>
      ))}
    </AnnotationRail>
  );
}

export default async function BlogPage() {
  const [featuredPosts, gridPosts, series] = await Promise.all([
    getFeaturedPosts(),
    getPublishedPostsForGrid(),
    getPublishedSeriesWithPosts(),
  ]);
  const featured = featuredPosts.find((p) => p.publishedAt);
  const seriesWithPosts = series.filter((s) => s.posts.length > 0);

  return (
    <div className="flex flex-col gap-16">
      <PageHeader eyebrow="Writing" title="Writing" description={description} />

      {featured && (
        <section className="flex flex-col gap-4">
          <Eyebrow>Featured</Eyebrow>
          <Card variant="transparent">
            <Link
              href={featured.metadata.canonical as Route}
              className="group flex flex-col gap-3"
            >
              <h2 className="font-display font-semibold text-2xl text-foreground group-hover:text-accent">
                {featured.title}
              </h2>
              {featured.summary && (
                <p className="text-muted leading-relaxed">{featured.summary}</p>
              )}
              <PostMeta
                publishedAt={featured.publishedAt}
                readingTime={featured.metadata.readingTime}
                tags={featured.tags}
              />
            </Link>
          </Card>
        </section>
      )}

      {seriesWithPosts.length > 0 && (
        <section className="flex flex-col gap-6">
          <Eyebrow>Series</Eyebrow>
          <div className="flex flex-col gap-4">
            {seriesWithPosts.map((s) => (
              <Card
                key={s.slug}
                variant="transparent"
                className="flex flex-col gap-2"
              >
                <h3 className="font-display font-medium text-foreground">
                  {s.title}
                  <span className="ml-2 font-mono text-muted text-xs">
                    {s.posts.length} parts
                  </span>
                </h3>
                <ul className="flex flex-col">
                  {s.posts.map((post, i) => (
                    <li key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}` as Route}
                        className="group flex items-baseline gap-3 py-1.5 text-muted text-sm hover:text-foreground"
                      >
                        <span className="font-mono text-muted text-xs tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="group-hover:text-accent">
                          {post.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-6">
        <Eyebrow>All posts</Eyebrow>
        <div className="flex flex-col gap-4">
          {gridPosts.map((post) => (
            <Card key={post.slug} variant="transparent">
              <Link
                href={post.metadata.canonical as Route}
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
                <PostMeta
                  publishedAt={post.publishedAt}
                  readingTime={post.metadata.readingTime}
                  tags={post.tags}
                />
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
