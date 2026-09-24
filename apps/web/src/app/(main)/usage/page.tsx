import { buildUsageNarrative } from "@workspace/usage/narrative";
import type { UsageProfile } from "@workspace/usage/types";
import type { Metadata } from "next";
import { Suspense } from "react";
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
import { UsageCacheEffort } from "./components/usage-cache-effort";
import { UsageCostScatter } from "./components/usage-cost-scatter";
import { UsageHeatmap } from "./components/usage-heatmap";
import { UsageHero } from "./components/usage-hero";
import { UsageLastUpdated } from "./components/usage-last-updated";
import { UsageModelCharacter } from "./components/usage-model-character";
import { UsageModelDrawer } from "./components/usage-model-drawer";
import { UsagePeriod } from "./components/usage-period";
import { UsageStackShift } from "./components/usage-stack-shift";

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

  const narrative = buildUsageNarrative({
    summary: profile.summary,
    firstActiveDate:
      profile.contributions.find((day) => day.totals.tokens > 0)?.date ?? null,
    topModel: profile.summary.favouriteModel
      ? (modelDisplayNames[profile.summary.favouriteModel] ??
        profile.summary.favouriteModel)
      : null,
    topAgent: profile.byAgent[0]?.key ?? null,
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
      <UsageHero
        description={description}
        lastUpdated={
          profile.lastUpdated ? (
            <UsageLastUpdated date={profile.lastUpdated} />
          ) : null
        }
        narrative={narrative}
        summary={profile.summary}
      />

      {/* The heatmap, period, stack-shift and breakdown sections read URL
          state via nuqs, which uses useSearchParams; under Cache Components
          that must sit inside a Suspense boundary so the rest of the page
          stays a static shell. */}
      <Suspense>
        <UsageHeatmap
          contributions={profile.contributions}
          modelDisplayNames={modelDisplayNames}
        />
      </Suspense>

      <Suspense>
        <UsagePeriod
          comparisons={profile.periods}
          modelDisplayNames={modelDisplayNames}
        />
      </Suspense>

      <Suspense>
        <UsageStackShift
          modelDisplayNames={modelDisplayNames}
          weeklyShare={profile.weeklyShare}
        />
      </Suspense>

      <UsageModelCharacter
        byModel={profile.byModel}
        modelDisplayNames={modelDisplayNames}
      />

      <UsageCostScatter
        byModel={profile.byModel}
        modelDisplayNames={modelDisplayNames}
      />

      <UsageCacheEffort
        cacheTrend={profile.cacheTrend}
        effort={profile.effort}
        tokenMix={profile.tokenMix}
      />

      <Suspense>
        <UsageBreakdown
          providerDisplayNames={providerDisplayNames}
          modelDisplayNames={modelDisplayNames}
          title="Explorer"
          views={getBreakdownViews(profile)}
        />
      </Suspense>

      <Suspense>
        <UsageModelDrawer
          byModel={profile.byModel}
          modelDisplayNames={modelDisplayNames}
          providerDisplayNames={providerDisplayNames}
        />
      </Suspense>
    </div>
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
