import { KPI, KPIGroup, Widget } from "@heroui-pro/react";
import {
  AnalyticsUpIcon,
  Calendar03Icon,
  DatabaseIcon,
  DollarCircleIcon,
  Fire02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import { type ComponentProps, Fragment } from "react";
import globalMetadata from "@/app/metadata";
import { PageTitle } from "@/components/page-title";
import { getUsageProfile } from "@/lib/queries/usage";
import { UsageBreakdown } from "./components/usage-breakdown";
import { UsageHeatmap } from "./components/usage-heatmap";
import { UsageTokenMix } from "./components/usage-token-mix";
import { UsageTrend } from "./components/usage-trend";

const title = "Usage";
const description =
  "Tokens and cost across my AI coding agents over time. Aggregates only.";
const canonical = "/usage";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: canonical,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
  },
  alternates: {
    canonical,
  },
};

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

export default async function UsagePage() {
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
    <div className="flex flex-col gap-8">
      <PageTitle
        title="Usage"
        description="Tokens and cost across my AI coding agents over time."
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <HugeiconsIcon
              icon={AnalyticsUpIcon}
              size={20}
              className="text-primary"
            />
          </div>
        }
      />

      <Widget>
        <Widget.Header>
          <Widget.Title>Token Usage Summary</Widget.Title>
          <Widget.Description>All agents</Widget.Description>
        </Widget.Header>
        <Widget.Content>
          <KPIGroup className="bg-transparent shadow-none">
            {summaryCards.map(({ key, ...card }, index) => (
              <Fragment key={key}>
                {index > 0 && <KPIGroup.Separator />}
                <StatCard {...card} />
              </Fragment>
            ))}
          </KPIGroup>
        </Widget.Content>
      </Widget>

      <Widget>
        <Widget.Header>
          <Widget.Title>Activity Heatmap</Widget.Title>
          <Widget.Description>
            Daily token usage across all agents
          </Widget.Description>
        </Widget.Header>
        <Widget.Content>
          <UsageHeatmap contributions={profile.contributions} />
        </Widget.Content>
      </Widget>

      <Widget>
        <Widget.Header>
          <Widget.Title>Usage Trend</Widget.Title>
          <Widget.Description>
            Tokens per day across all agents
          </Widget.Description>
        </Widget.Header>
        <Widget.Content>
          <UsageTrend contributions={profile.contributions} />
        </Widget.Content>
      </Widget>

      <Widget>
        <Widget.Header>
          <Widget.Title>Token Mix</Widget.Title>
          <Widget.Description>
            All-time token usage by category
          </Widget.Description>
        </Widget.Header>
        <Widget.Content>
          <UsageTokenMix tokenMix={profile.tokenMix} />
        </Widget.Content>
      </Widget>

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
