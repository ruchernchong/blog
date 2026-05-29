import { KPI } from "@heroui-pro/react";
import { formatCurrency, formatNumber } from "@/lib/usage/format";
import type { UsageSummary } from "@/lib/usage/types";

interface UsageStatsProps {
  summary: UsageSummary;
}

/**
 * Headline KPI cards. `KPI.Value` formats the number itself via its
 * `Intl.NumberFormat` props (compact, currency); footers carry the context.
 */
export function UsageStats({ summary }: UsageStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPI>
        <KPI.Header>
          <KPI.Title>Total Tokens</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value
            locale="en-SG"
            maximumFractionDigits={2}
            notation="compact"
            value={summary.totalTokens}
          />
        </KPI.Content>
        <KPI.Footer>
          across {formatNumber(summary.activeDays)} active days
        </KPI.Footer>
      </KPI>

      <KPI>
        <KPI.Header>
          <KPI.Title>Total Cost</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value
            currency="USD"
            locale="en-SG"
            style="currency"
            value={summary.totalCost}
          />
        </KPI.Content>
        <KPI.Footer>
          {formatCurrency(summary.averagePerDay)} per active day
        </KPI.Footer>
      </KPI>

      <KPI>
        <KPI.Header>
          <KPI.Title>Active Days</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value locale="en-SG" value={summary.activeDays} />
        </KPI.Content>
        <KPI.Footer>
          of {formatNumber(summary.totalDays)} days tracked
        </KPI.Footer>
      </KPI>

      <KPI>
        <KPI.Header>
          <KPI.Title>Longest Streak</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value locale="en-SG" value={summary.longestStreak} />
        </KPI.Content>
        <KPI.Footer>
          {formatNumber(summary.currentStreak)}-day current streak
        </KPI.Footer>
      </KPI>
    </div>
  );
}
