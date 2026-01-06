import { getGitHubStars } from "@/lib/github";
import { getPublishedPosts } from "@/lib/queries/posts";
import { QuickStatsClient } from "./quick-stats.client";
// TODO: Integrate with Umami Analytics
// import { getTotalVisits } from "...";

export async function QuickStats() {
  const [stars, postsCount] = await Promise.all([
    getGitHubStars(),
    getPublishedPosts().then((posts) => posts.length),
  ]);

  // TODO: Replace with Umami API call
  const totalVisits = 0;

  return (
    <QuickStatsClient
      visits={totalVisits}
      posts={postsCount}
      stars={stars ?? 0}
    />
  );
}
