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

export function HomeStatsSkeleton() {
  return (
    <div className="flex flex-wrap gap-8 pt-4">
      {["visits / yr", "contributions", "GitHub stars", "Claude tokens"].map(
        (label) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="h-8 w-16 animate-pulse rounded bg-default" />
            <span className="text-muted text-sm">{label}</span>
          </div>
        ),
      )}
    </div>
  );
}

export async function HomeStats() {
  const [visits, contributions, stars, tokens] = await Promise.all([
    getTotalVisits().catch(() => 0),
    getGitHubContributions()
      .then(
        (profile) => profile.contributionsCollection.totalCommitContributions,
      )
      .catch(() => 0),
    getGitHubStars().catch(() => 0),
    getUsageProfile()
      .then((profile) => profile.summary.totalTokens)
      .catch(() => 0),
  ]);

  return (
    <div className="flex flex-wrap gap-8 pt-4">
      <StatItem value={visits} label="visits / yr" />
      <StatItem value={contributions} label="contributions" />
      <StatItem value={stars} label="GitHub stars" />
      <StatItem value={tokens} label="Claude tokens" />
    </div>
  );
}
