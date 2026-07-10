import { Skeleton } from "@heroui/react";
import { Suspense } from "react";
import { getPublishedSeriesWithPosts } from "@/lib/queries/series";
import { SeriesCardsClient } from "./series-cards.client";

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
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-lg" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {SERIES_FALLBACKS.map((series) => (
            <div
              key={series}
              className="flex w-64 shrink-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function SeriesCardsContent() {
  const publishedSeries = await getPublishedSeriesWithPosts();

  if (publishedSeries.length === 0) {
    return null;
  }

  return <SeriesCardsClient series={publishedSeries} />;
}
