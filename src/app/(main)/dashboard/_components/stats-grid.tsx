import {
  AnalyticsUpIcon,
  SourceCodeIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { getTotalVisits } from "@/app/(main)/analytics/_actions/visits";
import { StatCard } from "@/app/(main)/dashboard/_components/stat-card";
import {
  getGitHubContributions,
  getGitHubFollowers,
  getGitHubStars,
} from "@/lib/github";

export async function StatsGrid() {
  const [totalVisits, followers, stars, contributions] = await Promise.all([
    getTotalVisits(),
    getGitHubFollowers(),
    getGitHubStars(),
    getGitHubContributions(),
  ]);

  const commits =
    contributions?.contributionsCollection.totalCommitContributions ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={
          <HugeiconsIcon icon={AnalyticsUpIcon} size={20} strokeWidth={2} />
        }
        label="Total Visits"
        value={totalVisits ?? 0}
      />
      <StatCard
        icon={<SiGithub className="size-5" />}
        label="GitHub Followers"
        value={followers ?? 0}
      />
      <StatCard
        icon={<HugeiconsIcon icon={StarIcon} size={20} strokeWidth={2} />}
        label="GitHub Stars"
        value={stars ?? 0}
      />
      <StatCard
        icon={<HugeiconsIcon icon={SourceCodeIcon} size={20} strokeWidth={2} />}
        label="Total Commits"
        value={commits}
      />
    </div>
  );
}
