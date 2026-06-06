import { buttonVariants, Separator } from "@heroui/react";
import { Widget } from "@heroui-pro/react";
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
      <Widget>
        <Widget.Header>
          <Widget.Title>Latest Posts</Widget.Title>
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            href="/blog"
          >
            View All
          </Link>
        </Widget.Header>
        <Widget.Content className="p-0">
          <div className="flex flex-col">
            {latestPosts.map((latestPost, index) => {
              if (!latestPost.publishedAt) {
                return null;
              }

              const formattedDate = format(
                latestPost.publishedAt,
                "dd MMM yyyy",
              );

              return (
                <div className="flex flex-col" key={latestPost.slug}>
                  <Link
                    href={latestPost.metadata.canonical as Route}
                    className="group flex items-start justify-between gap-4 p-5 transition-colors hover:bg-default/40"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-foreground transition-colors group-hover:text-accent">
                        {latestPost.title}
                      </span>
                      {latestPost.summary && (
                        <span className="line-clamp-2 text-muted text-sm leading-relaxed">
                          {latestPost.summary}
                        </span>
                      )}
                      <time
                        dateTime={formatISO(latestPost.publishedAt)}
                        className="text-muted text-sm"
                      >
                        {formattedDate}
                      </time>
                    </div>
                    <span className="shrink-0 text-muted text-sm">
                      {latestPost.metadata.readingTime}
                    </span>
                  </Link>
                  {index < latestPosts.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        </Widget.Content>
      </Widget>
    </motion.section>
  );
}
