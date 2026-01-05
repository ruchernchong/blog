import { getPublishedSeriesWithPosts } from "@/lib/queries/series";
import { SeriesCardsClient } from "./series-cards.client";

export async function SeriesCards() {
  const publishedSeries = await getPublishedSeriesWithPosts();

  if (publishedSeries.length === 0) {
    return null;
  }

  return <SeriesCardsClient series={publishedSeries} />;
}
