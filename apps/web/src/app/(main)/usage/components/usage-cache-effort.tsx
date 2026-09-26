import type {
  CacheTrendPoint,
  EffortSummary,
  TokenBreakdown,
} from "@/lib/usage/types";
import { UsageCacheSummary } from "./usage-cache-summary";
import { UsageEffortLevels } from "./usage-effort-levels";
import { UsageSection } from "./usage-section";
import { UsageTokenMix } from "./usage-token-mix";

interface UsageCacheEffortProps {
  tokenMix: TokenBreakdown;
  cacheTrend: CacheTrendPoint[];
  effort: EffortSummary | null;
}

/**
 * "Cache & effort": how much of the prompt side was served from cache and
 * what that saved, next to the effort distribution and the all-time token mix.
 */
export function UsageCacheEffort({
  tokenMix,
  cacheTrend,
  effort,
}: Readonly<UsageCacheEffortProps>) {
  return (
    <UsageSection
      description="Prompt tokens served from cache, what that saved against the full input price, and how hard I pushed the models."
      id="cache"
      title="Cache & effort"
    >
      <div className="grid gap-12 lg:grid-cols-2">
        <UsageCacheSummary cacheTrend={cacheTrend} tokenMix={tokenMix} />
        {effort ? <UsageEffortLevels effort={effort} /> : null}
      </div>
      <UsageTokenMix tokenMix={tokenMix} />
    </UsageSection>
  );
}
