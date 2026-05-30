import { buttonVariants, Typography } from "@heroui/react";
import { format, formatISO } from "date-fns";
import * as motion from "motion/react-client";
import type { Route } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/queries/posts";

export async function LatestPosts() {
  const allPosts = await getPublishedPosts();
  const latestPosts = allPosts.slice(0, 3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <Typography className="text-foreground">Latest Posts</Typography>
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href="/blog"
        >
          View All
        </Link>
      </div>

      <div className="flex flex-col">
        {latestPosts.map((latestPost) => {
          if (!latestPost.publishedAt) {
            return null;
          }

          const formattedDate = format(latestPost.publishedAt, "dd MMM yyyy");

          return (
            <Link
              key={latestPost.slug}
              href={latestPost.metadata.canonical as Route}
              className="group flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium transition-colors group-hover:text-primary">
                  {latestPost.title}
                </span>
                <time
                  dateTime={formatISO(latestPost.publishedAt)}
                  className="text-muted-foreground text-sm"
                >
                  {formattedDate}
                </time>
              </div>
              <span className="shrink-0 text-muted-foreground text-sm">
                {latestPost.metadata.readingTime}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
