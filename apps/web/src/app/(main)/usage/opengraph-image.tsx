import { buildHeatmapLayout } from "@workspace/usage/heatmap-layout";
import { ImageResponse } from "next/og";
import { OG_HEADERS, OG_SIZE } from "@/lib/og/config";
import { getOGFonts } from "@/lib/og/fonts";
import { UsageHeatmap } from "@/lib/og/templates/usage-heatmap";
import { getUsageProfile } from "@/lib/queries/usage";

export const alt = "Usage - Ru Chern";
export const size = OG_SIZE;
export const contentType = "image/png";

const compactNumberFormatter = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 1,
  notation: "compact",
});

const integerFormatter = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-SG", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  notation: "compact",
  style: "currency",
});

export default async function Image() {
  const [fonts, profile] = await Promise.all([getOGFonts(), getUsageProfile()]);

  // Derive the year from the data, not `new Date()`. A wall-clock read is a
  // non-deterministic operation that makes this route dynamic under Cache
  // Components; sourcing it from the (cached) profile keeps the route
  // prerenderable so the image is served statically from the CDN. `years` is
  // sorted ascending, so the last entry is the most recent year with activity.
  const latestYear = profile.years.at(-1)?.year;
  const yearContributions = latestYear
    ? profile.contributions.filter((c) => c.date.startsWith(latestYear))
    : [];
  const contributions =
    yearContributions.length > 0
      ? yearContributions
      : profile.contributions.slice(-364);

  const layout = buildHeatmapLayout(contributions);

  return new ImageResponse(
    <UsageHeatmap
      layout={layout}
      title="Usage"
      description="Tokens and cost across my AI coding agents over time."
      stats={[
        {
          label: "Total cost",
          value: usdFormatter.format(profile.summary.totalCost),
        },
        {
          label: "Tokens",
          value: compactNumberFormatter.format(profile.summary.totalTokens),
        },
        {
          label: "Active days",
          value: integerFormatter.format(profile.summary.activeDays),
        },
      ]}
    />,
    { ...size, fonts, headers: OG_HEADERS },
  );
}
