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

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;

  return (
    <SurfaceCard className="flex flex-col gap-12">
      <PageHeader
        title="Blog"
        description="Notes on software, tooling, and building for the web."
      />

      {!tag && <FeaturedPost />}
      {!tag && <SeriesCards />}
      <TopicsCloud activeTag={tag} />
      <PostGrid tag={tag} />
    </SurfaceCard>
  );
}
