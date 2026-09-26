import type { WeeklySeries } from "@workspace/usage/types";
import { OTHER_SERIES_KEY } from "@workspace/usage/weekly-insights";

/**
 * Categorical series colours in their validated order (see `--series-*` in
 * globals.css). Never cycled: anything past the last slot is folded into
 * "Other" upstream by `buildWeeklyShare`.
 */
export const SERIES_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
] as const;

export const OTHER_SERIES_COLOR = "var(--series-other)";

export interface SeriesMeta {
  key: string;
  label: string;
  color: string;
  /** Share of all tokens across every week, 0–1. */
  share: number;
  /** Models or agents folded into this series, largest first. */
  members: { key: string; label: string }[];
}

/**
 * Label, colour and all-time share for each weekly series. Series arrive
 * ranked by all-time tokens with "Other" last, so a given dataset always maps
 * the same entity to the same colour.
 */
export function describeSeries(
  series: WeeklySeries[],
  labelOf: (key: string) => string,
): SeriesMeta[] {
  const totals = series.map((entry) =>
    entry.tokens.reduce((sum, tokens) => sum + tokens, 0),
  );
  const grandTotal = totals.reduce((sum, total) => sum + total, 0);
  let slot = 0;

  return series.map((entry, index) => {
    const isOther = entry.key === OTHER_SERIES_KEY;
    const color = isOther
      ? OTHER_SERIES_COLOR
      : (SERIES_COLORS[slot++] ?? OTHER_SERIES_COLOR);
    return {
      key: entry.key,
      label: isOther ? "Other" : labelOf(entry.key),
      color,
      share: grandTotal > 0 ? totals[index] / grandTotal : 0,
      members: (entry.members ?? []).map((member) => ({
        key: member.key,
        label: labelOf(member.key),
      })),
    };
  });
}
