import { Card, Typography } from "@heroui/react";
import { formatTokens } from "@workspace/usage/format";
import type { TokenBreakdown } from "@workspace/usage/types";
import { type MixSegment, TokenMixChartClient } from "./token-mix-chart.client";

interface UsageTokenMixProps {
  tokenMix: TokenBreakdown;
}

/**
 * Category → label + HeroUI chart token. `color` feeds the chart `fill`;
 * `colorClass` is the matching Tailwind class for the legend dot (a literal so
 * Tailwind's scanner emits it). Mirrors HeroUI's documented BarChart legend
 * pattern, with the inline `style` swapped for a class.
 */
const CATEGORIES: {
  key: keyof TokenBreakdown;
  label: string;
  color: string;
  colorClass: string;
}[] = [
  {
    key: "cacheRead",
    label: "Cache read",
    color: "var(--chart-1)",
    colorClass: "bg-[var(--chart-1)]",
  },
  {
    key: "input",
    label: "Input",
    color: "var(--chart-2)",
    colorClass: "bg-[var(--chart-2)]",
  },
  {
    key: "output",
    label: "Output",
    color: "var(--chart-3)",
    colorClass: "bg-[var(--chart-3)]",
  },
  {
    key: "reasoning",
    label: "Reasoning",
    color: "var(--chart-4)",
    colorClass: "bg-[var(--chart-4)]",
  },
  {
    key: "cacheWrite",
    label: "Cache write",
    color: "var(--chart-5)",
    colorClass: "bg-[var(--chart-5)]",
  },
];

/**
 * Server component: shapes the all-time token mix into coloured segments and
 * renders the card shell + legend. Only the stacked bar is a client leaf.
 */
export function UsageTokenMix({ tokenMix }: UsageTokenMixProps) {
  const total = CATEGORIES.reduce((sum, c) => sum + tokenMix[c.key], 0);
  const ordered = CATEGORIES.map((category) => ({
    ...category,
    value: tokenMix[category.key],
    pct: total > 0 ? (tokenMix[category.key] / total) * 100 : 0,
  }))
    .filter((segment) => segment.value > 0)
    .sort((a, b) => b.value - a.value);

  const segments: MixSegment[] = ordered.map(
    ({ key, label, value, pct, color }) => ({ key, label, value, pct, color }),
  );

  return (
    <Card>
      <Card.Header>
        <Card.Title>Token mix</Card.Title>
        <Card.Description>
          All {formatTokens(total)} tokens by category
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-col gap-4">
          <TokenMixChartClient segments={segments} total={total} />
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {ordered.map((segment) => (
              <li className="flex items-center gap-2" key={segment.key}>
                <span
                  className={`size-3 shrink-0 rounded-full ${segment.colorClass}`}
                />
                <Typography type="body-sm">{segment.label}</Typography>
                <Typography color="muted" type="body-sm">
                  {formatTokens(segment.value)} ({Math.round(segment.pct)}%)
                </Typography>
              </li>
            ))}
          </ul>
        </div>
      </Card.Content>
    </Card>
  );
}
