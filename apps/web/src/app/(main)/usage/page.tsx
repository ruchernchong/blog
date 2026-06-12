import { AnalyticsUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import { PageTitle } from "@/components/page-title";
import { APP_LOCALE, APP_TIME_ZONE } from "@/constants/date-time";
import { getProviderDisplayNames } from "@/lib/queries/models";
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

const lastUpdatedFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: APP_TIME_ZONE,
  year: "numeric",
});

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
  const providerDisplayNames = await getProviderDisplayNames(
    getUsageProviderIds(profile),
  );
  const lastUpdated = profile.lastUpdated
    ? lastUpdatedFormatter.format(new Date(profile.lastUpdated))
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
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
        {lastUpdated && (
          <p className="text-muted text-sm">Last updated {lastUpdated}</p>
        )}
      </div>

      <UsageStats
        summary={profile.summary}
        contributions={profile.contributions}
      />

      <UsageHeatmap contributions={profile.contributions} />

      <UsageTrend contributions={profile.contributions} />

      <UsageTokenMix tokenMix={profile.tokenMix} />

      <UsageBreakdown
        providerDisplayNames={providerDisplayNames}
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
