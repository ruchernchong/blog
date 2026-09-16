import type { UsageProfile } from "@workspace/usage/types";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/app/components/page-header";
import { SurfaceCard } from "@/app/components/surface-card";
import globalMetadata from "@/app/metadata";
import {
  getModelDisplayNames,
  getProviderDisplayNames,
} from "@/lib/queries/models";
import { getUsageProfile } from "@/lib/queries/usage";
import {
  type BreakdownView,
  UsageBreakdown,
} from "./components/usage-breakdown";
import { UsageEffortLevels } from "./components/usage-effort-levels";
import { UsageHeatmap } from "./components/usage-heatmap";
import { UsageLastUpdated } from "./components/usage-last-updated";
import { UsageStats } from "./components/usage-stats";
import { UsageTokenMix } from "./components/usage-token-mix";
import { UsageTrend } from "./components/usage-trend";

const title = "Usage";
const description =
  "The API equivalent of my AI coding agents at provider list prices. Tokens, cost, and reasoning effort. Not what I paid. Aggregates only.";
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

      {/* The heatmap and breakdown read `?year=` / `?view=` via nuqs, which
          uses useSearchParams; under Cache Components that must sit inside a
          Suspense boundary so the rest of the page stays a static shell. */}
      <Suspense>
        <UsageHeatmap
          contributions={profile.contributions}
          modelDisplayNames={modelDisplayNames}
        />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
        <UsageTokenMix tokenMix={profile.tokenMix} />
        <UsageTrend contributions={profile.contributions} />
      </div>

      {profile.effort ? <UsageEffortLevels effort={profile.effort} /> : null}

      <Suspense>
        <UsageBreakdown
          providerDisplayNames={providerDisplayNames}
          modelDisplayNames={modelDisplayNames}
          title="Breakdown"
          views={getBreakdownViews(profile)}
        />
      </Suspense>
    </SurfaceCard>
  );
}

function getBreakdownViews(profile: UsageProfile): BreakdownView[] {
  return [
    {
      id: "model",
      label: "Model",
      description: "Tokens and API-equivalent cost grouped by model",
      rows: profile.byModel,
    },
    {
      id: "provider",
      label: "Provider",
      description: "Tokens and API-equivalent cost grouped by provider",
      rows: profile.byProvider,
    },
    {
      id: "agent",
      label: "Agent",
      description: "Tokens and API-equivalent cost grouped by agent",
      rows: profile.byAgent,
    },
  ];
}

function getUsageProviderIds(profile: UsageProfile) {
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

function getUsageModelIds(profile: UsageProfile) {
  return [
    ...new Set([
      ...profile.summary.models,
      ...profile.byModel.map((row) => row.key),
    ]),
  ].sort();
}
