import type { Metadata } from "next";
import { PageHeader } from "@/app/components/page-header";
import { SurfaceCard } from "@/app/components/surface-card";
import globalMetadata from "@/app/metadata";
import {
  getModelDisplayNames,
  getProviderDisplayNames,
} from "@/lib/queries/models";
import { getUsageProfile } from "@/lib/queries/usage";
import { UsageBreakdown } from "./components/usage-breakdown";
import { UsageHeatmap } from "./components/usage-heatmap";
import { UsageLastUpdated } from "./components/usage-last-updated";
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
  const [providerDisplayNames, modelDisplayNames] = await Promise.all([
    getProviderDisplayNames(getUsageProviderIds(profile)),
    getModelDisplayNames(getUsageModelIds(profile)),
  ]);

  return (
    <SurfaceCard width="wide" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Usage" description={description} />
        {profile.lastUpdated && <UsageLastUpdated date={profile.lastUpdated} />}
      </div>

      <UsageStats
        summary={profile.summary}
        contributions={profile.contributions}
        byModel={profile.byModel}
        modelDisplayNames={modelDisplayNames}
      />

      <UsageHeatmap contributions={profile.contributions} />

      <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
        <UsageTokenMix tokenMix={profile.tokenMix} />
        <UsageTrend contributions={profile.contributions} />
      </div>

      <UsageBreakdown
        providerDisplayNames={providerDisplayNames}
        modelDisplayNames={modelDisplayNames}
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
    </SurfaceCard>
  );
}

function getUsageProviderIds(
  profile: Awaited<ReturnType<typeof getUsageProfile>>,
) {
  return [
    ...new Set([
      ...profile.summary.providers,
      ...profile.byProvider.map((row) => row.key),
      ...profile.byModel.flatMap((row) => [
        ...(row.provider ? [row.provider] : []),
        ...row.providers,
      ]),
    ]),
  ].sort();
}

function getUsageModelIds(
  profile: Awaited<ReturnType<typeof getUsageProfile>>,
) {
  return [
    ...new Set([
      ...profile.summary.models,
      ...profile.byModel.map((row) => row.key),
    ]),
  ].sort();
}
