import { Skeleton } from "@heroui/react";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getPublishedSeriesWithPosts } from "@/lib/queries/series";

const SERIES_FALLBACKS = [
  "first-series",
  "second-series",
  "third-series",
] as const;

export function SeriesCards() {
  return (
    <Suspense fallback={<SeriesCardsFallback />}>
      <SeriesCardsContent />
    </Suspense>
  );
}

export function SeriesCardsFallback() {
  return (
    <section
      role="status"
      aria-label="Loading blog series"
      className="flex flex-col gap-4"
    >
      <Skeleton className="h-6 w-20 rounded-lg" />
      <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SERIES_FALLBACKS.map((series) => (
          <div
            key={series}
            className="flex flex-col gap-1.5 rounded-xl border border-border p-4"
          >
            <Skeleton className="h-3 w-12 rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}

async function SeriesCardsContent() {
  const publishedSeries = await getPublishedSeriesWithPosts();

  if (publishedSeries.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl tracking-tight">Series</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {publishedSeries.map((item) => {
          const firstPost = item.posts[0];

          return (
            <Link
              key={item.id}
              href={
                firstPost
                  ? (`/blog/${firstPost.slug}` as Route)
                  : ("/blog" as Route)
              }
              className="flex flex-col gap-1.5 rounded-xl border border-border p-4 transition-colors hover:bg-default/50"
            >
              <span className="font-mono text-muted text-xs">
                {item.postCount} {item.postCount === 1 ? "post" : "posts"}
              </span>
              <span className="font-semibold text-sm tracking-tight">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
