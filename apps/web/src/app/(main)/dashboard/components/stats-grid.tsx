import { Skeleton } from "@heroui/react";
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
          className="flex flex-col gap-2 rounded-2xl border border-border bg-default/50 p-5"
        >
          <Skeleton className="h-3 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-3 w-16 rounded-lg" />
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
        label="Total Visits"
        value={totalVisits ?? 0}
        note="this year"
        animate
        compact
      />
      <StatCard label="Contributions" value={commits} note="this year" />
      <StatCard
        label="GitHub Followers"
        value={followers ?? 0}
        note="on GitHub"
      />
      <StatCard label="GitHub Stars" value={stars ?? 0} note="across repos" />
    </div>
  );
}
