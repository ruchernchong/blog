import type { UsageBreakdownRow } from "@/lib/usage/types";

export interface CostPoint {
  key: string;
  label: string;
  tokens: number;
  cost: number;
  /** Blended USD per 1M tokens. */
  rate: number;
  messages: number;
  /** Set only on the biggest spenders, which get a direct label. */
  directLabel: string;
}

/**
 * Scatter points for "Where the money goes": one per priced model with
 * positive cost (both axes are log scale, so zero cannot be placed). The
 * `labelCount` biggest spenders carry a direct label; the rest rely on the
 * tooltip.
 */
export function toCostPoints(
  byModel: UsageBreakdownRow[],
  modelDisplayNames: Record<string, string>,
  labelCount = 5,
): CostPoint[] {
  const points = byModel.flatMap((row) =>
    row.cost !== null &&
    row.cost > 0 &&
    row.tokens > 0 &&
    row.costPerMillionTokens !== null
      ? [
          {
            key: row.key,
            label: modelDisplayNames[row.key] ?? row.key,
            tokens: row.tokens,
            cost: row.cost,
            rate: row.costPerMillionTokens,
            messages: row.messages,
            directLabel: "",
          },
        ]
      : [],
  );

  const labelled = new Set(
    [...points]
      .sort((a, b) => b.cost - a.cost)
      .slice(0, labelCount)
      .map((point) => point.key),
  );
  for (const point of points) {
    if (labelled.has(point.key)) point.directLabel = point.label;
  }
  return points;
}

export interface LogAxis {
  domain: [number, number];
  ticks: number[];
}

/**
 * Padded log-scale domain plus 1-2-5 ticks inside it. Recharts' "auto" log
 * domain ends exactly on the extreme points, which half-clips those dots and
 * their labels; `pad` widens each end by that factor.
 */
export function logAxis(values: number[], pad = 2): LogAxis {
  const positive = values.filter((value) => value > 0);
  if (positive.length === 0) {
    return { domain: [1, 10], ticks: [1, 10] };
  }
  const min = Math.min(...positive) / pad;
  const max = Math.max(...positive) * pad;
  const ticks: number[] = [];
  for (
    let exponent = Math.floor(Math.log10(min));
    exponent <= Math.ceil(Math.log10(max));
    exponent++
  ) {
    for (const step of [1, 2, 5]) {
      const tick = step * 10 ** exponent;
      if (tick >= min && tick <= max) ticks.push(tick);
    }
  }
  return { domain: [min, max], ticks };
}
