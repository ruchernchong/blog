import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { getFeaturedPosts } from "@/lib/queries/posts";

export async function FeaturedPost() {
  const featuredPosts = await getFeaturedPosts();
  const post = featuredPosts[0];

  if (!post?.publishedAt) {
    return null;
  }

  const formattedDate = format(post.publishedAt, "dd MMM yyyy");

  return (
    <Link
      href={post.metadata.canonical as Route}
      className="flex flex-col gap-2.5 rounded-2xl border border-border bg-default/50 p-7 transition-transform hover:-translate-y-1"
    >
      <span className="font-mono font-semibold text-accent text-xs uppercase tracking-widest">
        Featured
      </span>
      <h2 className="line-clamp-2 font-bold text-2xl capitalize tracking-tight">
        {post.title}
      </h2>
      {post.summary && (
        <p className="line-clamp-3 text-muted leading-relaxed">
          {post.summary}
        </p>
      )}
      <span className="font-mono text-muted text-sm">
        <time dateTime={formatISO(post.publishedAt)}>{formattedDate}</time>
        {post.metadata.readingTime && ` · ${post.metadata.readingTime}`}
      </span>
    </Link>
  );
}
