import { Skeleton } from "@heroui/react";
import {
  AnalyticsUpIcon,
  SourceCodeIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatCard } from "@/app/(main)/dashboard/components/stat-card";
import {
  getGitHubContributions,
  getGitHubFollowers,
  getGitHubStars,
} from "@/lib/github";
import { getTotalVisits } from "@/lib/queries/posthog";

const STAT_FALLBACKS = ["views", "visitors", "visits", "bounce-rate"] as const;

export function StatsGrid() {
  return (
    <Suspense fallback={<StatsGridFallback />}>
      <StatsGridContent />
    </Suspense>
  );
}

export function StatsGridFallback() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard statistics"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {STAT_FALLBACKS.map((stat) => (
        <div
          key={stat}
          aria-hidden="true"
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

async function StatsGridContent() {
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
