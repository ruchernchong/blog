"use client";

import { Chip, cn, Popover, ScrollShadow } from "@heroui/react";
import { LibraryIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

interface SeriesPost {
  slug: string;
  title: string;
}

interface SeriesItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  postCount: number;
  posts: SeriesPost[];
}

interface SeriesCardsClientProps {
  series: SeriesItem[];
  className?: string;
}

function SeriesPostsList({
  title,
  posts,
}: {
  title: string;
  posts: SeriesPost[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 border-border border-b pb-2">
        <span className="font-medium text-sm">{title}</span>
        <span className="text-muted text-xs">
          {posts.length} {posts.length === 1 ? "part" : "parts"}
        </span>
      </div>

      <ScrollShadow className="max-h-64">
        <div className="flex flex-col gap-1">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}` as Route}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground text-sm transition-colors hover:bg-default"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 font-medium text-accent text-xs">
                {index + 1}
              </span>
              <span className="line-clamp-2">{post.title}</span>
            </Link>
          ))}
        </div>
      </ScrollShadow>
    </div>
  );
}

export function SeriesCardsClient({
  series,
  className,
}: SeriesCardsClientProps) {
  if (series.length === 0) return null;

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={LibraryIcon} size={20} className="text-accent" />
        <h2 className="font-semibold text-lg">Series</h2>
      </div>

      <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:-mx-0 md:px-0">
        {series.map((item) => (
          <Popover key={item.id}>
            <Popover.Trigger className="group relative flex w-64 shrink-0 cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-md">
              {item.coverImage ? (
                <div className="relative h-24 w-full overflow-hidden rounded-lg">
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                  <HugeiconsIcon
                    icon={LibraryIcon}
                    size={32}
                    className="text-accent/40"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col gap-2">
                <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
                {item.description && (
                  <p className="line-clamp-2 text-muted text-sm">
                    {item.description}
                  </p>
                )}
                <Chip color="accent" variant="soft" size="sm">
                  {item.postCount} {item.postCount === 1 ? "part" : "parts"}
                </Chip>
              </div>
            </Popover.Trigger>
            <Popover.Content placement="bottom start">
              <Popover.Dialog>
                <SeriesPostsList title={item.title} posts={item.posts} />
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        ))}
      </div>
    </section>
  );
}
