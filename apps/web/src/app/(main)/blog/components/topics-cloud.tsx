import { cn } from "@heroui/react";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getPublishedPosts } from "@/lib/queries/posts";

interface TopicsCloudProps {
  activeTag?: string;
}

function sizeForRatio(ratio: number): string {
  if (ratio > 0.75) return "text-xl";
  if (ratio > 0.5) return "text-lg";
  if (ratio > 0.25) return "text-base";
  return "text-sm";
}

export function TopicsCloud({ activeTag }: TopicsCloudProps) {
  return (
    <Suspense fallback={null}>
      <TopicsCloudContent activeTag={activeTag} />
    </Suspense>
  );
}

async function TopicsCloudContent({ activeTag }: TopicsCloudProps) {
  const allPosts = await getPublishedPosts();

  const counts = new Map<string, number>();
  for (const post of allPosts) {
    for (const tag of post.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return null;
  }

  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = tags[0][1];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl tracking-tight">Topics</h2>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        {tags.map(([tag, tagCount], index) => {
          // Exactly one pill reads as solid coral: the active tag when
          // filtering, otherwise the most-used tag for visual emphasis.
          const isSolid = activeTag ? tag === activeTag : index === 0;

          return (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}` as Route}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold tracking-tight transition-transform hover:-translate-y-0.5",
                sizeForRatio(tagCount / maxCount),
                isSolid
                  ? "bg-accent text-accent-foreground"
                  : "bg-default/50 hover:bg-default",
              )}
            >
              {tag}
              <span
                className={cn(
                  "font-mono text-xs",
                  isSolid ? "text-accent-foreground/70" : "text-muted",
                )}
              >
                {tagCount}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
