import {
  formatCurrencyCompact,
  formatNumber,
  formatTokens,
} from "@workspace/usage/format";
import type { UsageSummary } from "@workspace/usage/types";
import type { ReactNode } from "react";

interface UsageHeroProps {
  summary: UsageSummary;
  /** Generated summary sentence, or null when there is no usage yet. */
  narrative: string | null;
  /** Page description, shown as the API-equivalent disclaimer. */
  description: string;
  /** Last-updated stamp, rendered next to the eyebrow. */
  lastUpdated?: ReactNode;
}

/**
 * Editorial opener for `/usage`: the generated one-sentence story set large,
 * then the headline figures as oversized numerals rather than KPI cards.
 */
export function UsageHero({
  summary,
  narrative,
  description,
  lastUpdated,
}: UsageHeroProps) {
  const figures = [
    {
      label: "API equivalent",
      value: formatCurrencyCompact(summary.totalCost),
    },
    { label: "Tokens", value: formatTokens(summary.totalTokens) },
    { label: "Active days", value: formatNumber(summary.activeDays) },
    { label: "Models", value: formatNumber(summary.models.length) },
  ];

  return (
    <header className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-mono font-semibold text-accent text-xs uppercase tracking-widest">
            Usage
          </h1>
          {lastUpdated}
        </div>
        <p className="max-w-5xl text-balance font-bold text-3xl tracking-tighter sm:text-5xl">
          {narrative ?? "No usage recorded yet."}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-6 border-border border-t pt-6 lg:grid-cols-4">
        {figures.map((figure) => (
          <div className="flex flex-col-reverse gap-2" key={figure.label}>
            <dt className="font-medium text-muted text-xs uppercase tracking-wider">
              {figure.label}
            </dt>
            <dd className="font-bold text-4xl tabular-nums tracking-tighter sm:text-6xl">
              {figure.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="max-w-2xl text-muted text-sm leading-relaxed">
        {description}
      </p>
    </header>
  );
}
