import { Suspense } from "react";
import { getGitHubStars } from "@/lib/github";
import { getPublishedPosts } from "@/lib/queries/posts";
import { getTotalVisits } from "@/lib/umami";
import { QuickStatsClient } from "./quick-stats.client";

export async function QuickStats() {
  const [totalVisits, stars, postsCount] = await Promise.all([
    getTotalVisits(),
    getGitHubStars(),
    getPublishedPosts().then((posts) => posts.length),
  ]);

  return (
    <Suspense>
      <QuickStatsClient
        visits={totalVisits}
        posts={postsCount}
        stars={stars ?? 0}
      />
    </Suspense>
  );
}
