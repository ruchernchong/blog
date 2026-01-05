import { Notebook02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturedPost } from "@/app/(main)/blog/_components/featured-post";
import { PostGrid } from "@/app/(main)/blog/_components/post-grid";
import { SeriesCards } from "@/app/(main)/blog/_components/series-cards";
import { PageTitle } from "@/components/page-title";

export const metadata: Metadata = {
  title: "Blog",
  description: "My blog posts on coding, tech, and random thoughts.",
};

export default function BlogPage() {
  return (
    <>
      <PageTitle
        title="Blog"
        description="My blog posts on coding, tech, and random thoughts."
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <HugeiconsIcon
              icon={Notebook02Icon}
              size={20}
              className="text-primary"
            />
          </div>
        }
        className="mb-8"
      />

      <div className="flex flex-col gap-8">
        <Suspense>
          <FeaturedPost />
        </Suspense>

        <Suspense>
          <SeriesCards />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Suspense>
            <PostGrid />
          </Suspense>
        </div>
      </div>
    </>
  );
}
