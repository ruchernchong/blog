import type { PeriodComparisons } from "@workspace/usage/period-comparison";
import { UsagePeriodClient } from "./usage-period.client";
import { UsageSection } from "./usage-section";

interface UsagePeriodProps {
  /** Precomputed in `getUsageProfile` from uncapped per-model totals. */
  comparisons: PeriodComparisons;
  modelDisplayNames: Record<string, string>;
}

/**
 * Server shell for "This period". Every window length arrives precomputed, so
 * the client only switches between three small objects instead of receiving
 * the daily series a second time.
 */
export function UsagePeriod({
  comparisons,
  modelDisplayNames,
}: UsagePeriodProps) {
  return (
    <UsageSection
      description="The latest stretch of data against the one before it."
      id="period"
      title="This period"
    >
      <UsagePeriodClient
        comparisons={comparisons}
        modelDisplayNames={modelDisplayNames}
      />
    </UsageSection>
  );
}
