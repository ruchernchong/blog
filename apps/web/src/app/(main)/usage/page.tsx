import { AnalyticsUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import { PageTitle } from "@/components/page-title";
import { getUsageProfile } from "@/lib/queries/usage";
import { UsageBreakdown } from "./components/usage-breakdown";
import { UsageHeatmap } from "./components/usage-heatmap";
import { UsageStats } from "./components/usage-stats";
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

export default async function UsagePage() {
  const profile = await getUsageProfile();

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

      <UsageStats
        summary={profile.summary}
        contributions={profile.contributions}
      />

      <UsageHeatmap contributions={profile.contributions} />

      <UsageTrend contributions={profile.contributions} />

      <UsageTokenMix tokenMix={profile.tokenMix} />

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
