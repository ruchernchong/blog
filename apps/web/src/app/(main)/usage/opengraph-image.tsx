import { ImageResponse } from "next/og";
import { OG_HEADERS, OG_SIZE } from "@/lib/og/config";
import { getOGFonts } from "@/lib/og/fonts";
import { UsageHeatmap } from "@/lib/og/templates/usage-heatmap";
import { getModelDisplayNames } from "@/lib/queries/models";
import { getUsageProfile } from "@/lib/queries/usage";
import { buildHeatmapLayout } from "@/lib/usage/heatmap-layout";
import { buildUsageNarrativeParts } from "@/lib/usage/narrative";

export const alt = "Usage - Ru Chern";
export const size = OG_SIZE;
export const contentType = "image/png";

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

// The headline wraps word by word with no line cap (Satori has no lineClamp
// for mixed-colour text), so bound the only unbounded input: a long model
// name could otherwise push the heatmap out of the fixed 1200x630 frame.
const MAX_MODEL_NAME_LENGTH = 32;

function truncate(name: string): string {
  // Count code points, not UTF-16 units, so a cut never splits a surrogate pair.
  const chars = Array.from(name);
  return chars.length > MAX_MODEL_NAME_LENGTH
    ? `${chars
        .slice(0, MAX_MODEL_NAME_LENGTH - 1)
        .join("")
        .trimEnd()}…`
    : name;
}

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

  const { favouriteModel } = profile.summary;
  const modelDisplayNames = favouriteModel
    ? await getModelDisplayNames([favouriteModel])
    : {};
  const headline = buildUsageNarrativeParts({
    summary: profile.summary,
    firstActiveDate:
      profile.contributions.find((day) => day.totals.tokens > 0)?.date ?? null,
    topModel: favouriteModel
      ? truncate(modelDisplayNames[favouriteModel] ?? favouriteModel)
      : null,
    topAgent: profile.byAgent[0]?.key ?? null,
  }) ?? [
    {
      text: "The API equivalent of my AI coding agents at provider list prices.",
    },
  ];

  return new ImageResponse(
    <UsageHeatmap
      layout={layout}
      eyebrow="Usage"
      headline={headline}
      // Tokens and active days are already in the headline.
      stats={[
        {
          label: "API equivalent",
          value: usdFormatter.format(profile.summary.totalCost),
        },
        {
          label: "models",
          value: integerFormatter.format(profile.summary.models.length),
        },
      ]}
    />,
    { ...size, fonts, headers: OG_HEADERS },
  );
}
