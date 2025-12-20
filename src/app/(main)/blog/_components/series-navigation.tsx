import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  LibraryIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SeriesPost {
  slug: string;
  title: string;
}

interface SeriesNavigationProps {
  seriesTitle: string;
  seriesSlug: string;
  currentPosition: number;
  totalPosts: number;
  previousPost: SeriesPost | null;
  nextPost: SeriesPost | null;
  className?: string;
}

export function SeriesNavigation({
  seriesTitle,
  seriesSlug,
  currentPosition,
  totalPosts,
  previousPost,
  nextPost,
  className,
}: SeriesNavigationProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href={`/blog?series=${seriesSlug}` as Route}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground text-sm transition-all duration-200 hover:bg-primary/90"
        >
          <HugeiconsIcon icon={LibraryIcon} size={16} />
          {seriesTitle}
        </Link>

        <span className="text-muted-foreground text-sm">
          Part {currentPosition} of {totalPosts}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {previousPost ? (
          <Link
            href={`/blog/${previousPost.slug}` as Route}
            className="group flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
            title={previousPost.title}
          >
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            <span className="line-clamp-1 max-w-32 md:max-w-48">
              {previousPost.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {nextPost ? (
          <Link
            href={`/blog/${nextPost.slug}` as Route}
            className="group flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
            title={nextPost.title}
          >
            <span className="line-clamp-1 max-w-32 md:max-w-48">
              {nextPost.title}
            </span>
            <HugeiconsIcon
              icon={ArrowRight02Icon}
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
