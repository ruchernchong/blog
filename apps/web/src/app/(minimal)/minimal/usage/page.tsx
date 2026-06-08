import { KPI, KPIGroup } from "@heroui-pro/react";
import {
  AnalyticsUpIcon,
  Calendar03Icon,
  DatabaseIcon,
  DollarCircleIcon,
  Fire02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ComponentProps, Fragment } from "react";
import { UsageBreakdown } from "@/app/(main)/usage/components/usage-breakdown";
import { UsageHeatmap } from "@/app/(main)/usage/components/usage-heatmap";
import { UsageTokenMix } from "@/app/(main)/usage/components/usage-token-mix";
import { UsageTrend } from "@/app/(main)/usage/components/usage-trend";
import { getUsageProfile } from "@/lib/queries/usage";

interface StatCardProps {
  title: string;
  icon: IconSvgElement;
  status: "success" | "warning" | "danger";
  value: number;
  valueProps?: Omit<ComponentProps<typeof KPI.Value>, "value" | "locale">;
}

function StatCard({ title, icon, status, value, valueProps }: StatCardProps) {
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

function MinimalCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {description && <p className="text-muted text-sm">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default async function MinimalUsagePage() {
  const profile = await getUsageProfile();

  const summaryCards: (StatCardProps & { key: string })[] = [
    {
      key: "tokens",
      title: "Total Tokens",
      icon: DatabaseIcon,
      status: "success",
      value: profile.summary.totalTokens,
      valueProps: { notation: "compact", maximumFractionDigits: 2 },
    },
    {
      key: "cost",
      title: "Total Cost",
      icon: DollarCircleIcon,
      status: "warning",
      value: profile.summary.totalCost,
      valueProps: { style: "currency", currency: "USD" },
    },
    {
      key: "active-days",
      title: "Active Days",
      icon: Calendar03Icon,
      status: "success",
      value: profile.summary.activeDays,
    },
    {
      key: "streak",
      title: "Longest Streak",
      icon: Fire02Icon,
      status: "danger",
      value: profile.summary.longestStreak,
    },
  ];

  return (
    <div className="flex flex-col gap-12 py-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-bold text-4xl text-foreground tracking-tight md:text-5xl">
          Usage.
        </h1>
        <p className="max-w-xl text-lg text-muted leading-relaxed">
          Tokens and cost across my AI coding agents over time. Aggregates only.
        </p>
      </div>

      <MinimalCard title="Token Usage Summary" description="All agents">
        <KPIGroup className="bg-transparent shadow-none">
          {summaryCards.map(({ key, ...card }, index) => (
            <Fragment key={key}>
              {index > 0 && <KPIGroup.Separator />}
              <StatCard {...card} />
            </Fragment>
          ))}
        </KPIGroup>
      </MinimalCard>

      <MinimalCard
        title="Activity Heatmap"
        description="Daily token usage across all agents"
      >
        <UsageHeatmap contributions={profile.contributions} />
      </MinimalCard>

      <MinimalCard
        title="Usage Trend"
        description="Tokens per day across all agents"
      >
        <UsageTrend contributions={profile.contributions} />
      </MinimalCard>

      <MinimalCard
        title="Token Mix"
        description="All-time token usage by category"
      >
        <UsageTokenMix tokenMix={profile.tokenMix} />
      </MinimalCard>

      <UsageBreakdown
        title="Breakdown"
        views={[
          {
            id: "model",
            label: "Model",
            description: "Tokens and cost grouped by model",
            rows: profile.byModel,
          },
          {
            id: "provider",
            label: "Provider",
            description: "Tokens and cost grouped by provider",
            rows: profile.byProvider,
          },
          {
            id: "agent",
            label: "Agent",
            description: "Tokens and cost grouped by agent",
            rows: profile.byAgent,
          },
        ]}
      />
    </div>
  );
}
