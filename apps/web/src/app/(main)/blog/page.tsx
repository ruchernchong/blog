import type { Metadata } from "next";
import { FeaturedPost } from "@/app/(main)/blog/components/featured-post";
import { PostGrid } from "@/app/(main)/blog/components/post-grid";
import { SeriesCards } from "@/app/(main)/blog/components/series-cards";
import { TopicsCloud } from "@/app/(main)/blog/components/topics-cloud";
import { PageHeader } from "@/app/components/page-header";
import { SurfaceCard } from "@/app/components/surface-card";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on engineering, technology, and shipping side projects.",
};

export default function BlogPage() {
  // Every section reads only cached data, so the whole page prerenders into the
  // static shell. The `?tag=` filter is request-time, but it is resolved
  // client-side inside TopicsCloud (highlight) and PostGrid (list filter), so
  // neither the page nor those sections need a server-side searchParams read.
  return (
    <SurfaceCard className="flex flex-col gap-12">
      <PageHeader
        title="Blog"
        description="Notes on software, tooling, and building for the web."
      />
      <FeaturedPost />
      <SeriesCards />
      <TopicsCloud />
      <PostGrid />
    </SurfaceCard>
  );
}
