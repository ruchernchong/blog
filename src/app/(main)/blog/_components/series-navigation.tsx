import {
  ArrowDown01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  LibraryIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Route } from "next";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SeriesPost {
  slug: string;
  title: string;
}

interface SeriesNavigationProps {
  seriesTitle: string;
  seriesSlug: string;
  currentSlug: string;
  seriesPosts: SeriesPost[];
  currentPosition: number;
  totalPosts: number;
  previousPost: SeriesPost | null;
  nextPost: SeriesPost | null;
  className?: string;
}

function SeriesPostsList({
  posts,
  currentSlug,
  seriesSlug,
}: {
  posts: SeriesPost[];
  currentSlug: string;
  seriesSlug: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <span className="font-medium text-sm">In this series</span>
        <Link
          href={`/blog?series=${seriesSlug}` as Route}
          className="text-muted-foreground text-xs transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <ScrollArea className="max-h-64">
        <div className="flex flex-col gap-1">
          {posts.map((post, index) => {
            const isCurrent = post.slug === currentSlug;
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}` as Route}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isCurrent
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full font-medium text-xs",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className="line-clamp-2">{post.title}</span>
                {isCurrent && (
                  <span className="ml-auto text-primary text-xs">Current</span>
                )}
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SeriesNavigation({
  seriesTitle,
  seriesSlug,
  currentSlug,
  seriesPosts,
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
        <Popover>
          <PopoverTrigger className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground text-sm transition-all duration-200 hover:bg-primary/90">
            <HugeiconsIcon icon={LibraryIcon} size={16} />
            {seriesTitle}
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
          </PopoverTrigger>
          <PopoverContent sideOffset={8} align="center">
            <SeriesPostsList
              posts={seriesPosts}
              currentSlug={currentSlug}
              seriesSlug={seriesSlug}
            />
          </PopoverContent>
        </Popover>

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
