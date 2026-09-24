import type { DayContribution } from "./types";

/** Window lengths offered by the "This period" toggle, in days. */
export const PERIOD_LENGTHS = [7, 30, 90] as const;

export type PeriodLength = (typeof PERIOD_LENGTHS)[number];

export interface PeriodTotals {
  /** First and last day (YYYY-MM-DD) of the window, inclusive. */
  start: string;
  end: string;
  tokens: number;
  /** Summed priced cost; unpriced days count as nothing. */
  cost: number;
  activeDays: number;
  messages: number;
  /** Model with the most tokens in the window, or null when idle. */
  topModel: string | null;
}

export interface PeriodComparison {
  days: number;
  current: PeriodTotals;
  /** The equal-length window just before `current`; null without history. */
  previous: PeriodTotals | null;
  /** Relative change current vs previous (0.25 = +25%); null when undefined. */
  change: {
    tokens: number | null;
    cost: number | null;
    activeDays: number | null;
  };
}

function totalsOf(days: DayContribution[]): PeriodTotals {
  const modelTokens = new Map<string, number>();
  let tokens = 0;
  let cost = 0;
  let activeDays = 0;
  let messages = 0;

  for (const day of days) {
    tokens += day.totals.tokens;
    cost += day.totals.cost ?? 0;
    messages += day.totals.messages;
    if (day.totals.tokens > 0) activeDays += 1;
    // Per-day models are capped to the day's biggest few, so the window's
    // leader is exact whenever it leads (or places) on the days it ran.
    for (const model of day.models) {
      modelTokens.set(
        model.model,
        (modelTokens.get(model.model) ?? 0) + model.tokens,
      );
    }
  }

  let topModel: string | null = null;
  let topTokens = 0;
  for (const [model, total] of modelTokens) {
    if (total > topTokens) {
      topModel = model;
      topTokens = total;
    }
  }

  return {
    start: days[0].date,
    end: days[days.length - 1].date,
    tokens,
    cost,
    activeDays,
    messages,
    topModel,
  };
}

function relativeChange(current: number, previous: number): number | null {
  return previous > 0 ? (current - previous) / previous : null;
}

/**
 * Compare the last `days` days of data against the `days` before them.
 * Windows end at the latest ingested day rather than the wall clock, so the
 * comparison stays stable between ingests. Expects `contributions` dense and
 * oldest first, as `getUsageProfile` returns them.
 */
export function comparePeriods(
  contributions: DayContribution[],
  days: number,
): PeriodComparison | null {
  if (contributions.length === 0 || days <= 0) {
    return null;
  }

  const currentDays = contributions.slice(-days);
  const previousDays = contributions.slice(-2 * days, -days);
  const current = totalsOf(currentDays);
  // A partial previous window would make every delta look like growth.
  const previous = previousDays.length === days ? totalsOf(previousDays) : null;

  return {
    days,
    current,
    previous,
    change: {
      tokens: previous ? relativeChange(current.tokens, previous.tokens) : null,
      cost: previous ? relativeChange(current.cost, previous.cost) : null,
      activeDays: previous
        ? relativeChange(current.activeDays, previous.activeDays)
        : null,
    },
  };
}
