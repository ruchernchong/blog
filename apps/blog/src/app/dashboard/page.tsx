"use client";

import { StarIcon, CodeBracketIcon } from "@heroicons/react/24/solid";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { MetricCard } from "@/components/metric-card";
import { trpc } from "@/trpc/client";

const Dashboard = () => {
  const { data: followers, isLoading: followersLoading } =
    trpc.github.getFollowers.useQuery();
  const { data: stars, isLoading: starsLoading } =
    trpc.github.getStars.useQuery();
  const { data: contributions, isLoading: contributionsLoading } =
    trpc.github.getContributions.useQuery();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          📊 Just sharing a quick snapshot of a few personal wins and milestones
          I&#39;ve hit along the way—it’s been a fun ride so far!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="GitHub Followers"
          value={followersLoading ? "..." : (followers ?? 0)}
          icon={<SiGithub className="size-8" />}
        />
        <MetricCard
          title="GitHub Stars"
          value={starsLoading ? "..." : (stars ?? 0)}
          icon={<StarIcon className="size-8" />}
        />
        <MetricCard
          title="Total Commits"
          value={
            contributionsLoading
              ? "..."
              : (contributions?.contributionsCollection
                  .totalCommitContributions ?? 0)
          }
          icon={<CodeBracketIcon className="size-8" />}
        />
      </div>
    </div>
  );
};

export default Dashboard;
