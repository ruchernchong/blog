import { KPI, NumberValue } from "@heroui-pro/react";
import {
  AiBrain02Icon,
  AnalyticsUpIcon,
  DatabaseIcon,
  DollarCircleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
  DayContribution,
  UsageBreakdownRow,
  UsageSummary,
} from "@workspace/usage/types";
import type { ComponentProps, ReactNode } from "react";

interface UsageStatsProps {
  summary: UsageSummary;
  contributions: DayContribution[];
  byModel: UsageBreakdownRow[];
}

interface UsageStatCardProps {
  title: string;
  icon: IconSvgElement;
  status: "success" | "warning" | "danger";
  value?: number;
  valueContent?: ReactNode;
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
  valueContent,
  footer,
  chartData,
  chartColor,
  valueProps,
}: UsageStatCardProps) {
  return (
    <KPI variant="transparent">
      <KPI.Header>
        <KPI.Icon status={status}>
          <HugeiconsIcon icon={icon} />
        </KPI.Icon>
        <KPI.Title>{title}</KPI.Title>
      </KPI.Header>
      <KPI.Content>
        {valueContent ?? (
          <KPI.Value locale="en-SG" value={value ?? 0} {...valueProps} />
        )}
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

export function UsageStats({
  summary,
  contributions,
  byModel,
}: UsageStatsProps) {
  const trailingDays = contributions.slice(-SPARKLINE_DAYS);
  const costSparkline = trailingDays.map((day) => ({
    value: day.totals.cost ?? 0,
  }));
  const tokenSparkline = trailingDays.map((day) => ({
    value: day.totals.tokens,
  }));
  const activeDayAverageSparkline = trailingActiveDayAverage(trailingDays);
  const topModel = byModel[0];
  const topModelShare =
    topModel && summary.totalTokens > 0
      ? topModel.tokens / summary.totalTokens
      : 0;

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
    {
      key: "top-model",
      title: "Top Model",
      icon: AiBrain02Icon,
      status: "success",
      valueContent: (
        <dd
          className="truncate font-semibold text-2xl text-foreground tracking-tight"
          title={summary.favouriteModel ?? undefined}
        >
          {summary.favouriteModel ?? "No usage yet"}
        </dd>
      ),
      footer: topModel ? (
        <>
          <NumberValue
            formatOptions={{ maximumFractionDigits: 1, style: "percent" }}
            locale="en-SG"
            value={topModelShare}
          />{" "}
          of all tokens
        </>
      ) : (
        "No model usage yet"
      ),
      chartData: topModel
        ? topModel.sparkline.map((value) => ({ value }))
        : tokenSparkline,
      chartColor: "var(--chart-1)",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, ...card }) => (
        <UsageStatCard key={key} {...card} />
      ))}
    </div>
  );
}
