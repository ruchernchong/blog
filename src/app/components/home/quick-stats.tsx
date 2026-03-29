import { getGitHubStars } from "@/lib/github";
import { getPublishedPostsCount } from "@/lib/queries/posts";
import { StatsBar } from "./stats-bar";

export async function QuickStats() {
  const [stars, postsCount] = await Promise.all([
    getGitHubStars(),
    getPublishedPostsCount(),
  ]);

  return <StatsBar posts={postsCount} stars={stars ?? 0} visits={undefined} />;
}
