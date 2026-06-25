import { connection } from "next/server";
import { StatReadout } from "@/components/stat-readout";
import {
  getGitHubContributions,
  getGitHubFollowers,
  getGitHubStars,
} from "@/lib/github";
import { getTotalVisits } from "@/lib/queries/posthog";

export async function StatsGrid() {
  await connection();
  const [totalVisits, followers, stars, contributions] = await Promise.all([
    getTotalVisits(),
    getGitHubFollowers(),
    getGitHubStars(),
    getGitHubContributions(),
  ]);

  const commits =
    contributions?.contributionsCollection.totalCommitContributions ?? 0;

  return (
    <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
      <StatReadout
        label="Total Visits"
        value={(totalVisits ?? 0).toLocaleString()}
      />
      <StatReadout
        label="GitHub Followers"
        value={(followers ?? 0).toLocaleString()}
      />
      <StatReadout label="GitHub Stars" value={(stars ?? 0).toLocaleString()} />
      <StatReadout label="Total Commits" value={commits.toLocaleString()} />
    </div>
  );
}
