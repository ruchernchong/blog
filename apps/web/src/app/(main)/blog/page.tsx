import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturedPost } from "@/app/(main)/blog/components/featured-post";
import {
  PostGrid,
  PostGridFallback,
} from "@/app/(main)/blog/components/post-grid";
import { SeriesCards } from "@/app/(main)/blog/components/series-cards";
import { TopicsCloud } from "@/app/(main)/blog/components/topics-cloud";
import { PageHeader } from "@/app/components/page-header";
import { SurfaceCard } from "@/app/components/surface-card";

type BlogPageProps = {
  searchParams: Promise<{ tag?: string }>;
};

async function BlogContent({ searchParams }: BlogPageProps) {
  const { tag } = await searchParams;

  return (
    <>
      {!tag && <FeaturedPost />}
      {!tag && <SeriesCards />}
      <TopicsCloud activeTag={tag} />
      <PostGrid tag={tag} />
    </>
  );
}

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on engineering, technology, and shipping side projects.",
};

export default function BlogPage({ searchParams }: BlogPageProps) {
  return (
    <SurfaceCard className="flex flex-col gap-12">
      <PageHeader
        title="Blog"
        description="Notes on software, tooling, and building for the web."
      />
      <Suspense fallback={<PostGridFallback />}>
        <BlogContent searchParams={searchParams} />
      </Suspense>
    </SurfaceCard>
  );
}
