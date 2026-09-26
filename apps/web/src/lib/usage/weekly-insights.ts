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
 * Model family rules, checked in order against the model slug. A family groups
 * successive versions into one stack band so each era of the stack keeps a
 * colour; the tooltip still breaks the band down by model.
 */
const MODEL_FAMILIES: [RegExp, string][] = [
  [/claude-opus/, "Claude Opus"],
  [/claude-fable/, "Claude Fable"],
  [/claude-sonnet/, "Claude Sonnet"],
  [/claude-haiku/, "Claude Haiku"],
  [/codex/, "GPT Codex"],
  [/^gpt-/, "GPT"],
  [/gemini/, "Gemini"],
  [/grok/, "Grok"],
  [/kimi/, "Kimi"],
  [/glm/, "GLM"],
  [/minimax/, "MiniMax"],
];

/** Family label for a model slug; an unrecognised slug is its own family. */
export function modelFamily(model: string): string {
  return MODEL_FAMILIES.find(([pattern]) => pattern.test(model))?.[1] ?? model;
}

/**
 * Tokens per week for each distinct `keyOf(fact)`, grouped by `groupOf(key)`.
 * The `topN` groups with the largest summed weekly share keep their own series
 * (largest first); the rest fold into a single trailing
 * {@link OTHER_SERIES_KEY} series. Ranking by weekly share rather than raw
 * tokens gives a quieter era its own colour instead of losing it to "Other".
 * Each series lists its member keys, largest first.
 */
function weeklySeries(
  facts: UsageFact[],
  weeks: string[],
  keyOf: (fact: UsageFact) => string,
  topN: number,
  groupOf: (key: string) => string = (key) => key,
): WeeklySeries[] {
  const weekIndex = new Map(weeks.map((week, index) => [week, index]));
  const byKey = new Map<string, number[]>();
  for (const fact of facts) {
    const index = weekIndex.get(isoWeekStart(fact.date));
    if (index === undefined) continue;
    const key = keyOf(fact);
    let tokens = byKey.get(key);
    if (!tokens) {
      tokens = weeks.map(() => 0);
      byKey.set(key, tokens);
    }
    tokens[index] += fact.totalTokens;
  }

  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const members = [...byKey.entries()]
    .map(([key, tokens]) => ({ key, tokens }))
    .sort(
      (a, b) => sum(b.tokens) - sum(a.tokens) || a.key.localeCompare(b.key),
    );

  const groups = new Map<string, WeeklySeries>();
  for (const member of members) {
    const group = groupOf(member.key);
    const entry = groups.get(group) ?? {
      key: group,
      tokens: weeks.map(() => 0),
      members: [],
    };
    member.tokens.forEach((tokens, index) => {
      entry.tokens[index] += tokens;
    });
    entry.members?.push(member);
    groups.set(group, entry);
  }

  const weekTotals = weeks.map((_, index) =>
    members.reduce((total, member) => total + member.tokens[index], 0),
  );
  const shareScore = (tokens: number[]) =>
    tokens.reduce(
      (score, value, index) =>
        weekTotals[index] > 0 ? score + value / weekTotals[index] : score,
      0,
    );
  const ranked = [...groups.values()].sort(
    (a, b) =>
      shareScore(b.tokens) - shareScore(a.tokens) ||
      sum(b.tokens) - sum(a.tokens) ||
      a.key.localeCompare(b.key),
  );

  const named = ranked.slice(0, topN);
  const tail = ranked.slice(topN);
  if (tail.length === 0) return named;

  const other: WeeklySeries = {
    key: OTHER_SERIES_KEY,
    tokens: weeks.map(() => 0),
    members: tail
      .flatMap((group) => group.members ?? [])
      .sort(
        (a, b) => sum(b.tokens) - sum(a.tokens) || a.key.localeCompare(b.key),
      ),
  };
  for (const group of tail) {
    group.tokens.forEach((tokens, index) => {
      other.tokens[index] += tokens;
    });
  }
  return [...named, other];
}

/**
 * Weekly token volume by model family and by agent, for the stacked "how my
 * stack shifted" chart. Weeks are dense (idle weeks are zero) so the x-axis is
 * even.
 */
export function buildWeeklyShare(
  facts: UsageFact[],
  topN = WEEKLY_SHARE_TOP_N,
): WeeklyShare {
  const weeks = denseWeeks(facts);
  return {
    weeks,
    models: weeklySeries(facts, weeks, (fact) => fact.model, topN, modelFamily),
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

/** Row key holding one member's share of the week inside its series. */
export function memberShareKey(seriesKey: string, memberKey: string): string {
  return `${seriesKey}\u0000${memberKey}`;
}

/**
 * Convert weekly token series into per-week shares (0–1) for a 100% stacked
 * chart, plus each member's share under {@link memberShareKey}. An idle week
 * carries no series keys, so the chart leaves a gap rather than collapsing the
 * stack to 0%.
 */
export function toWeeklyShareRows(
  weeks: string[],
  series: WeeklySeries[],
): WeeklyShareRow[] {
  return weeks.map((week, index) => {
    const total = series.reduce((sum, entry) => sum + entry.tokens[index], 0);
    const row: WeeklyShareRow = { week };
    if (total === 0) return row;
    for (const entry of series) {
      row[entry.key] = entry.tokens[index] / total;
      for (const member of entry.members ?? []) {
        row[memberShareKey(entry.key, member.key)] =
          member.tokens[index] / total;
      }
    }
    return row;
  });
}
