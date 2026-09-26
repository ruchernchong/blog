"use client";

import { format, parseISO } from "date-fns";
import { useQueryState } from "nuqs";
import {
  formatCurrencyCompact,
  formatNumber,
  formatTokens,
} from "@/lib/usage/format";
import {
  PERIOD_LENGTHS,
  type PeriodComparisons,
} from "@/lib/usage/period-comparison";
import { usageParsers } from "../searchParams";
import { UsageToggle } from "./usage-toggle.client";

interface UsagePeriodClientProps {
  /** One comparison per window length, precomputed on the server. */
  comparisons: PeriodComparisons;
  /** Registry slug → display name for the top-model figure. */
  modelDisplayNames: Record<string, string>;
}

const percent = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
  style: "percent",
});

function formatRange(start: string, end: string): string {
  return `${format(parseISO(start), "d MMM")} – ${format(parseISO(end), "d MMM yyyy")}`;
}

/** Arrow plus signed percentage; direction is never carried by colour alone. */
function Change({
  value,
  days,
}: Readonly<{ value: number | null; days: number }>) {
  if (value === null) {
    return <span className="text-muted text-sm">No prior {days} days</span>;
  }
  let arrow = "▬";
  if (value > 0) {
    arrow = "▲";
  } else if (value < 0) {
    arrow = "▼";
  }
  return (
    <span className="text-muted text-sm tabular-nums">
      <span aria-hidden="true">{arrow} </span>
      {percent.format(value)} vs previous {days} days
    </span>
  );
}

/**
 * "This period": the trailing window against the one before it. The window
 * length lives in `?period=` so a shared link opens on the same comparison.
 */
export function UsagePeriodClient({
  comparisons,
  modelDisplayNames,
}: Readonly<UsagePeriodClientProps>) {
  const [period, setPeriod] = useQueryState(
    "period",
    usageParsers.period.withOptions({ history: "replace" }),
  );
  const comparison = comparisons[period];

  if (!comparison) {
    return <p className="text-muted text-sm">No activity yet.</p>;
  }

  const { current, change, days } = comparison;
  const topModel = current.topModel
    ? (modelDisplayNames[current.topModel] ?? current.topModel)
    : "None";
  const figures = [
    {
      label: "Tokens",
      value: formatTokens(current.tokens),
      change: change.tokens,
    },
    {
      label: "API equivalent",
      value: formatCurrencyCompact(current.cost),
      change: change.cost,
    },
    {
      label: "Active days",
      value: `${formatNumber(current.activeDays)} / ${formatNumber(days)}`,
      change: change.activeDays,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <UsageToggle
          label="Period"
          onChange={setPeriod}
          options={PERIOD_LENGTHS.map((length) => ({
            value: length,
            label: `${length} days`,
          }))}
          value={period}
        />
        <span className="font-mono text-muted text-sm">
          {formatRange(current.start, current.end)}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {figures.map((figure) => (
          <div className="flex flex-col gap-2" key={figure.label}>
            <dt className="font-medium text-muted text-xs uppercase tracking-wider">
              {figure.label}
            </dt>
            <dd className="flex flex-col gap-2">
              <span className="font-bold text-3xl tabular-nums tracking-tight">
                {figure.value}
              </span>
              <Change days={days} value={figure.change} />
            </dd>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <dt className="font-medium text-muted text-xs uppercase tracking-wider">
            Top model
          </dt>
          <dd
            className="truncate font-bold text-3xl tracking-tight"
            title={topModel}
          >
            {topModel}
          </dd>
        </div>
      </dl>
    </div>
  );
}
