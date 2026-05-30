import { KPI, KPIGroup } from "@heroui-pro/react";
import {
  Calendar03Icon,
  DatabaseIcon,
  DollarCircleIcon,
  Fire02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ComponentProps, Fragment } from "react";
import type { UsageSummary } from "@/lib/usage/types";

interface UsageStatsProps {
  summary: UsageSummary;
}

interface UsageStatCardProps {
  title: string;
  icon: IconSvgElement;
  status: "success" | "warning" | "danger";
  value: number;
  valueProps?: Omit<ComponentProps<typeof KPI.Value>, "value" | "locale">;
}

function UsageStatCard({
  title,
  icon,
  status,
  value,
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
    </KPI>
  );
}

export function UsageStats({ summary }: UsageStatsProps) {
  const cards: (UsageStatCardProps & { key: string })[] = [
    {
      key: "tokens",
      title: "Total Tokens",
      icon: DatabaseIcon,
      status: "success",
      value: summary.totalTokens,
      valueProps: { notation: "compact", maximumFractionDigits: 2 },
    },
    {
      key: "cost",
      title: "Total Cost",
      icon: DollarCircleIcon,
      status: "warning",
      value: summary.totalCost,
      valueProps: { style: "currency", currency: "USD" },
    },
    {
      key: "active-days",
      title: "Active Days",
      icon: Calendar03Icon,
      status: "success",
      value: summary.activeDays,
    },
    {
      key: "streak",
      title: "Longest Streak",
      icon: Fire02Icon,
      status: "danger",
      value: summary.longestStreak,
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
