"use client";

import type { Route } from "next";
import Link from "next/link";
import { format, formatISO } from "date-fns";
import { motion } from "motion/react";
import type { SelectPost } from "@/schema/posts";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/typography";

interface LatestPostsProps {
  posts: SelectPost[];
}

function PostItem({ post }: { post: SelectPost }) {
  if (!post.publishedAt) {
    return null;
  }

  const formattedDate = format(post.publishedAt, "dd MMM yyyy");

  return (
    <Link
      href={post.metadata.canonical as Route}
      className="group flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium transition-colors group-hover:text-primary">
          {post.title}
        </span>
        <time
          dateTime={formatISO(post.publishedAt)}
          className="text-muted-foreground text-sm"
        >
          {formattedDate}
        </time>
      </div>
      <span className="shrink-0 text-muted-foreground text-sm">
        {post.metadata.readingTime}
      </span>
    </Link>
  );
}

export function LatestPosts({ posts }: LatestPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <Typography variant="label" className="text-foreground">
          Latest Posts
        </Typography>
        <Button variant="ghost" size="sm" render={<Link href="/blog" />}>
          View All
        </Button>
      </div>

      <div className="flex flex-col">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>
    </motion.section>
  );
}
