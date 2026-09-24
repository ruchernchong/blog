import { addWeeks, format, parseISO, startOfISOWeek } from "date-fns";
import type {
  CacheTrendPoint,
  Cost,
  UsageFact,
  WeeklySeries,
  WeeklyShare,
} from "./types";

/**
 * Series key for everything outside the top N. Underscored so it can never
 * collide with a real model or agent id.
 */
export const OTHER_SERIES_KEY = "__other__";

/** Default number of named series before the tail folds into "Other". */
export const WEEKLY_SHARE_TOP_N = 6;

/** Monday (ISO week start) of the week containing `date`, as YYYY-MM-DD. */
export function isoWeekStart(date: string): string {
  return format(startOfISOWeek(parseISO(date)), "yyyy-MM-dd");
}

/** Every ISO week start from the earliest to the latest fact, oldest first. */
function denseWeeks(facts: UsageFact[]): string[] {
  if (facts.length === 0) {
    return [];
  }

  let first = facts[0].date;
  let last = facts[0].date;
  for (const fact of facts) {
    if (fact.date < first) first = fact.date;
    if (fact.date > last) last = fact.date;
  }

  const end = isoWeekStart(last);
  const weeks: string[] = [];
  for (
    let week = parseISO(isoWeekStart(first));
    format(week, "yyyy-MM-dd") <= end;
    week = addWeeks(week, 1)
  ) {
    weeks.push(format(week, "yyyy-MM-dd"));
  }
  return weeks;
}

/**
 * Tokens per week for each distinct `keyOf(fact)`. The `topN` largest keys by
 * all-time tokens keep their own series (largest first); the rest fold into a
 * single trailing {@link OTHER_SERIES_KEY} series.
 */
function weeklySeries(
  facts: UsageFact[],
  weeks: string[],
  keyOf: (fact: UsageFact) => string,
  topN: number,
): WeeklySeries[] {
  const weekIndex = new Map(weeks.map((week, index) => [week, index]));
  const totals = new Map<string, number>();
  for (const fact of facts) {
    const key = keyOf(fact);
    totals.set(key, (totals.get(key) ?? 0) + fact.totalTokens);
  }

  const ranked = [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key]) => key);
  const named = new Set(ranked.slice(0, topN));
  const hasOther = ranked.length > named.size;

  const series = new Map<string, number[]>();
  for (const key of [...named, ...(hasOther ? [OTHER_SERIES_KEY] : [])]) {
    series.set(
      key,
      weeks.map(() => 0),
    );
  }

  for (const fact of facts) {
    const key = keyOf(fact);
    const target = series.get(named.has(key) ? key : OTHER_SERIES_KEY);
    const index = weekIndex.get(isoWeekStart(fact.date));
    if (target && index !== undefined) {
      target[index] += fact.totalTokens;
    }
  }

  return [...series.entries()].map(([key, tokens]) => ({ key, tokens }));
}

/**
 * Weekly token volume by model and by agent, for the stacked "how my stack
 * shifted" chart. Weeks are dense (idle weeks are zero) so the x-axis is even.
 */
export function buildWeeklyShare(
  facts: UsageFact[],
  topN = WEEKLY_SHARE_TOP_N,
): WeeklyShare {
  const weeks = denseWeeks(facts);
  return {
    weeks,
    models: weeklySeries(facts, weeks, (fact) => fact.model, topN),
    agents: weeklySeries(facts, weeks, (fact) => fact.agent, topN),
  };
}

/**
 * Weekly cache-hit rate (cache reads over all prompt-side tokens) and the
 * estimated saving from those reads versus paying the full input rate.
 */
export function buildCacheTrend(facts: UsageFact[]): CacheTrendPoint[] {
  const weeks = denseWeeks(facts);
  const buckets = new Map(
    weeks.map((week) => [
      week,
      { cacheRead: 0, prompt: 0, savings: 0, priced: false },
    ]),
  );

  for (const fact of facts) {
    const bucket = buckets.get(isoWeekStart(fact.date));
    if (!bucket) continue;
    const { input, cacheRead, cacheWrite } = fact.tokens;
    bucket.cacheRead += cacheRead;
    bucket.prompt += input + cacheRead + cacheWrite;
    if (fact.cacheSavings !== null) {
      bucket.savings += fact.cacheSavings;
      bucket.priced = true;
    }
  }

  return weeks.map((week) => {
    const bucket = buckets.get(week);
    const savings: Cost = bucket?.priced ? bucket.savings : null;
    return {
      week,
      hitRate:
        bucket && bucket.prompt > 0 ? bucket.cacheRead / bucket.prompt : null,
      savings,
    };
  });
}

/** One stacked-chart row: the week plus each series' share of that week. */
export type WeeklyShareRow = { week: string } & Record<string, number | string>;

/**
 * Convert weekly token series into per-week shares (0–1) for a 100% stacked
 * chart. An idle week has every share at 0 rather than dividing by zero.
 */
export function toWeeklyShareRows(
  weeks: string[],
  series: WeeklySeries[],
): WeeklyShareRow[] {
  return weeks.map((week, index) => {
    const total = series.reduce((sum, entry) => sum + entry.tokens[index], 0);
    const row: WeeklyShareRow = { week };
    for (const entry of series) {
      row[entry.key] = total > 0 ? entry.tokens[index] / total : 0;
    }
    return row;
  });
}
