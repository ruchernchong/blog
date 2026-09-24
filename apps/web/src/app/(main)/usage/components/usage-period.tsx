import {
  comparePeriods,
  PERIOD_LENGTHS,
  type PeriodComparison,
  type PeriodLength,
} from "@workspace/usage/period-comparison";
import type { DayContribution } from "@workspace/usage/types";
import { UsagePeriodClient } from "./usage-period.client";
import { UsageSection } from "./usage-section";

interface UsagePeriodProps {
  contributions: DayContribution[];
  modelDisplayNames: Record<string, string>;
}

/**
 * Server shell for "This period". Every window length is compared here so the
 * client only switches between three small objects instead of receiving the
 * daily series a second time.
 */
export function UsagePeriod({
  contributions,
  modelDisplayNames,
}: UsagePeriodProps) {
  const comparisons = Object.fromEntries(
    PERIOD_LENGTHS.map((length) => [
      length,
      comparePeriods(contributions, length),
    ]),
  ) as Record<PeriodLength, PeriodComparison | null>;

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
