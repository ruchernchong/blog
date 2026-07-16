import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { getRelatedPosts } from "@/lib/services/related-posts";

interface RelatedPostsProps {
  slug: string;
}

export async function RelatedPosts({ slug }: RelatedPostsProps) {
  const relatedPosts = await getRelatedPosts(slug, 4);

  if (!relatedPosts.length) return null;

  return (
    <section className="not-prose flex flex-col">
      <h2 className="mb-4 font-semibold text-xl tracking-tight">
        Related posts
      </h2>
      {relatedPosts.map((post) => {
        if (!post.publishedAt) return null;

        const formattedDate = format(post.publishedAt, "dd MMM yyyy");

        return (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}` as Route}
            className="flex flex-col gap-1.5 border-separator border-t py-4 transition-transform hover:translate-x-1.5"
          >
            <span className="font-semibold capitalize">{post.title}</span>
            <span className="font-mono text-muted text-sm">
              <time dateTime={formatISO(post.publishedAt)}>
                {formattedDate}
              </time>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
