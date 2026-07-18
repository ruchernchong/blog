import { Suspense } from "react";
import { getGitHubContributions, getGitHubStars } from "@/lib/github";
import { getTotalVisits } from "@/lib/queries/posthog";
import { getUsageProfile } from "@/lib/queries/usage";
import { AnimatedCounter } from "./animated-counter";

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-bold font-mono text-2xl tracking-tight">
        <AnimatedCounter value={value} compact />
      </span>
      <span className="text-muted text-sm">{label}</span>
    </div>
  );
}

function StatSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="h-8 w-16 animate-pulse rounded bg-default" />
      <span className="text-muted text-sm">{label}</span>
    </div>
  );
}

async function VisitsStat() {
  const visits = await getTotalVisits().catch(() => 0);
  return <StatItem value={visits} label="visits / yr" />;
}

async function ContributionsStat() {
  const contributions = await getGitHubContributions()
    .then((profile) => profile.contributionsCollection.totalCommitContributions)
    .catch(() => 0);
  return <StatItem value={contributions} label="contributions" />;
}

async function StarsStat() {
  const stars = await getGitHubStars().catch(() => 0);
  return <StatItem value={stars} label="GitHub stars" />;
}

async function TokensStat() {
  const tokens = await getUsageProfile()
    .then((profile) => profile.summary.totalTokens)
    .catch(() => 0);
  return <StatItem value={tokens} label="Claude tokens" />;
}

export function HomeStats() {
  return (
    <div className="flex flex-wrap gap-8 pt-4">
      <Suspense fallback={<StatSkeleton label="visits / yr" />}>
        <VisitsStat />
      </Suspense>
      <Suspense fallback={<StatSkeleton label="contributions" />}>
        <ContributionsStat />
      </Suspense>
      <Suspense fallback={<StatSkeleton label="GitHub stars" />}>
        <StarsStat />
      </Suspense>
      <Suspense fallback={<StatSkeleton label="Claude tokens" />}>
        <TokensStat />
      </Suspense>
    </div>
  );
}
