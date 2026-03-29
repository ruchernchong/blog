import { getGitHubStars } from "@/lib/github";
import { getPublishedPostsCount } from "@/lib/queries/posts";
import { getTotalVisits } from "@/lib/umami";
import { StatsBar } from "./stats-bar";

export async function SiteVisits() {
  const [totalVisits, stars, postsCount] = await Promise.all([
    getTotalVisits(),
    getGitHubStars(),
    getPublishedPostsCount(),
  ]);

  return (
    <StatsBar visits={totalVisits} posts={postsCount} stars={stars ?? 0} />
  );
}
