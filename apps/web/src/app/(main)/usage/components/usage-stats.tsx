import { KPI, KPIGroup, NumberValue } from "@heroui-pro/react";
import {
  AnalyticsUpIcon,
  DatabaseIcon,
  DollarCircleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { DayContribution, UsageSummary } from "@workspace/usage/types";
import { type ComponentProps, Fragment, type ReactNode } from "react";

interface UsageStatsProps {
  summary: UsageSummary;
  contributions: DayContribution[];
}

interface UsageStatCardProps {
  title: string;
  icon: IconSvgElement;
  status: "success" | "warning" | "danger";
  value: number;
  footer: ReactNode;
  chartData: { value: number }[];
  chartColor: string;
  valueProps?: Omit<ComponentProps<typeof KPI.Value>, "value" | "locale">;
}

const SPARKLINE_DAYS = 30;

const USD_COMPACT_FORMAT_OPTIONS = {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  notation: "compact",
  style: "currency",
} satisfies Intl.NumberFormatOptions;

function trailingActiveDayAverage(
  days: DayContribution[],
): { value: number }[] {
  let total = 0;
  let activeDays = 0;

  return days.map((day) => {
    if (day.totals.tokens > 0) {
      total += day.totals.cost ?? 0;
      activeDays += 1;
    }

    return { value: activeDays > 0 ? total / activeDays : 0 };
  });
}

function UsageStatCard({
  title,
  icon,
  status,
  value,
  footer,
  chartData,
  chartColor,
  valueProps,
}: UsageStatCardProps) {
  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status={status}>
          <HugeiconsIcon icon={icon} />
        </KPI.Icon>
        <KPI.Title>{title}</KPI.Title>
      </KPI.Header>
      <KPI.Content>
        <KPI.Value locale="en-SG" value={value} {...valueProps} />
      </KPI.Content>
      <KPI.Chart
        color={chartColor}
        data={chartData}
        height={48}
        strokeWidth={1.5}
      />
      <KPI.Footer>
        <p className="text-muted text-sm">{footer}</p>
      </KPI.Footer>
    </KPI>
  );
}

export function UsageStats({ summary, contributions }: UsageStatsProps) {
  const trailingDays = contributions.slice(-SPARKLINE_DAYS);
  const costSparkline = trailingDays.map((day) => ({
    value: day.totals.cost ?? 0,
  }));
  const tokenSparkline = trailingDays.map((day) => ({
    value: day.totals.tokens,
  }));
  const activeDayAverageSparkline = trailingActiveDayAverage(trailingDays);

  const cards: (UsageStatCardProps & { key: string })[] = [
    {
      key: "cost",
      title: "Total Cost",
      icon: DollarCircleIcon,
      status: "warning",
      value: summary.totalCost,
      footer: summary.bestDay ? (
        <>
          Best day{" "}
          <NumberValue
            formatOptions={USD_COMPACT_FORMAT_OPTIONS}
            locale="en-SG"
            value={summary.bestDay.cost}
          />
        </>
      ) : (
        "No priced usage yet"
      ),
      chartData: costSparkline,
      chartColor: "var(--chart-3)",
      valueProps: {
        formatOptions: USD_COMPACT_FORMAT_OPTIONS,
      },
    },
    {
      key: "tokens",
      title: "Total Tokens",
      icon: DatabaseIcon,
      status: "success",
      value: summary.totalTokens,
      footer: `${summary.activeDays.toLocaleString("en-SG")} active days`,
      chartData: tokenSparkline,
      chartColor: "var(--color-success)",
      valueProps: { notation: "compact", maximumFractionDigits: 2 },
    },
    {
      key: "average-active-day",
      title: "Avg / Active Day",
      icon: AnalyticsUpIcon,
      status: "success",
      value: summary.averagePerDay,
      footer: `Current streak ${summary.currentStreak.toLocaleString("en-SG")} days`,
      chartData: activeDayAverageSparkline,
      chartColor: "var(--chart-2)",
      valueProps: {
        formatOptions: USD_COMPACT_FORMAT_OPTIONS,
      },
    },
  ];

  return (
    <>
      {/* Mobile / tablet: standalone cards in a responsive grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
        {cards.map(({ key, ...card }) => (
          <UsageStatCard key={key} {...card} />
        ))}
      </div>

      {/* Desktop: one unified KPIGroup bar with separators */}
      <div className="hidden lg:block">
        <KPIGroup>
          {cards.map(({ key, ...card }, index) => (
            <Fragment key={key}>
              {index > 0 && <KPIGroup.Separator />}
              <UsageStatCard {...card} />
            </Fragment>
          ))}
        </KPIGroup>
      </div>
    </>
  );
}
