import {
  formatCurrencyCompact,
  formatNumber,
  formatTokens,
} from "@workspace/usage/format";
import type { UsageNarrativePart } from "@workspace/usage/narrative";
import type { UsageSummary } from "@workspace/usage/types";
import type { ReactNode } from "react";

interface UsageHeroProps {
  summary: UsageSummary;
  /** Generated summary sentence parts, or null when there is no usage yet. */
  narrative: UsageNarrativePart[] | null;
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
          {narrative ? streamNarrative(narrative) : "No usage recorded yet."}
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

/** Total time for the narrative to finish streaming in, in milliseconds. */
const STREAM_DURATION_MS = 1200;

/**
 * Splits the narrative into words that blur in one after another, like a model
 * streaming its reply. Pure CSS, so the full sentence is still in the HTML and
 * reduced-motion users see it straight away.
 */
function streamNarrative(parts: UsageNarrativePart[]) {
  const words = parts.map((part) => part.text.split(/(\s+)/));
  const stagger =
    STREAM_DURATION_MS /
    Math.max(1, words.flat().filter((word) => word.trim()).length);
  let wordIndex = 0;

  return parts.map((part, partIndex) => {
    const content = words[partIndex].map((word, index) => {
      if (!word.trim()) return word;
      const delay = wordIndex++ * stagger;
      return (
        <span
          className="motion-safe:animate-stream-in"
          // biome-ignore lint/suspicious/noArrayIndexKey: words are a fixed, ordered split
          key={index}
          style={{ animationDelay: `${Math.round(delay)}ms` }}
        >
          {word}
        </span>
      );
    });

    return (
      <span
        className={part.highlight ? "text-accent" : undefined}
        // biome-ignore lint/suspicious/noArrayIndexKey: parts are a fixed, ordered template
        key={partIndex}
      >
        {content}
      </span>
    );
  });
}
