import { getTotalVisits } from "@/app/(main)/analytics/_actions/visits";
import { getGitHubStars } from "@/lib/github";
import { getPublishedPosts } from "@/lib/queries/posts";
import { QuickStatsClient } from "./quick-stats.client";

export async function QuickStats() {
  const [totalVisits, stars, postsCount] = await Promise.all([
    getTotalVisits(),
    getGitHubStars(),
    getPublishedPosts().then((posts) => posts.length),
  ]);

  return (
    <QuickStatsClient
      visits={totalVisits ?? 0}
      posts={postsCount}
      stars={stars ?? 0}
    />
  );
}
