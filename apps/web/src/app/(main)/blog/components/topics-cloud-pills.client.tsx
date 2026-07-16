"use client";

import { cn } from "@heroui/react";
import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type TagEntry = [tag: string, count: number];

interface TopicPillsProps {
  tags: TagEntry[];
  maxCount: number;
  /** Highlighted tag. Falsy → the most-used tag is highlighted instead. */
  activeTag?: string;
}

function sizeForRatio(ratio: number): string {
  if (ratio > 0.75) return "text-xl";
  if (ratio > 0.5) return "text-lg";
  if (ratio > 0.25) return "text-base";
  return "text-sm";
}

/**
 * Presentational tag pills. Pure (no hooks) so it can render both in the static
 * shell (as the Suspense fallback, with the default highlight) and inside the
 * client component below once the active tag is known.
 */
export function TopicPills({ tags, maxCount, activeTag }: TopicPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
      {tags.map(([tag, tagCount], index) => {
        // Exactly one pill reads as solid coral: the active tag when filtering,
        // otherwise the most-used tag for visual emphasis.
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
  );
}

/**
 * Reads the active `?tag=` on the client so the cloud can stay in the prerendered
 * shell. `useSearchParams` is null during prerender (see the Suspense fallback in
 * topics-cloud.tsx), then highlights the active tag after hydration.
 */
export function ActiveTopicPills({
  tags,
  maxCount,
}: Omit<TopicPillsProps, "activeTag">) {
  const activeTag = useSearchParams().get("tag") ?? undefined;

  return <TopicPills tags={tags} maxCount={maxCount} activeTag={activeTag} />;
}
