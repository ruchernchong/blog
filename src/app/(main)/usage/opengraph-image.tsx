import { ImageResponse } from "next/og";
import { OG_SIZE } from "@/lib/og/config";
import { getOGFonts } from "@/lib/og/fonts";
import { UsageHeatmap } from "@/lib/og/templates/usage-heatmap";
import { getUsageProfile } from "@/lib/queries/usage";
import { buildHeatmapLayout } from "@/lib/usage/heatmap-layout";

export const alt = "Usage - Ru Chern";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 86400;

export default async function Image() {
  const [fonts, profile] = await Promise.all([getOGFonts(), getUsageProfile()]);

  const currentYear = new Date().getFullYear().toString();
  const yearContributions = profile.contributions.filter((c) =>
    c.date.startsWith(currentYear),
  );
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
    />,
    { ...size, fonts },
  );
}
