import type { Pricing } from "@workspace/usage/pricing";
import type {
  AgentDayBreakdown,
  Cost,
  DayContribution,
  TokenBreakdown,
  UsageBreakdownRow,
  UsageProfile,
  UsageSummary,
  YearSummary,
} from "@workspace/usage/types";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  and,
  asc,
  eq,
  getTableColumns,
  isNull,
  type SQL,
  sql,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, type InsertTokenUsage, tokenUsage } from "@/schema";

/** Postgres caps bound parameters per statement; chunk large upserts under it. */
const UPSERT_CHUNK_SIZE = 1000;

/**
 * Composite primary key of `token_usage`. A conflict on these four columns means
 * we already have that daily aggregate and should overwrite it.
 */
const CONFLICT_TARGET = [
  tokenUsage.date,
  tokenUsage.agent,
  tokenUsage.provider,
  tokenUsage.model,
] as const;

/** Columns refreshed from the incoming row on conflict (everything but the key). */
const UPDATE_COLUMNS = [
  "inputTokens",
  "outputTokens",
  "cacheReadTokens",
  "cacheWriteTokens",
  "reasoningTokens",
  "totalTokens",
  "costUsd",
  "messages",
] as const satisfies (keyof typeof tokenUsage.$inferInsert)[];

/**
 * Mirror the Drizzle `casing: "snake_case"` config (see `drizzle.config.ts`).
 * Columns are declared without explicit DB names, so `Column.name` holds the
 * camelCase property key and the snake_case mapping is applied only at
 * query-build time — it is *not* available on the column object. The `excluded.`
 * pseudo-row in an upsert needs the real DB column name, so convert it here.
 */
function toSnakeCase(name: string): string {
  return name.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

/**
 * Build the `onConflictDoUpdate` set object from the table definition, pointing
 * each column at its `excluded` (incoming) value, so the column list is never
 * hand-written. See the Drizzle upsert guide.
 */
function excludedColumns(
  columns: readonly (keyof InsertTokenUsage)[],
): Record<string, SQL> {
  const cols = getTableColumns(tokenUsage);
  const set: Record<string, SQL> = {};
  for (const column of columns) {
    set[column] = sql.raw(`excluded.${toSnakeCase(cols[column].name)}`);
  }
  return set;
}

/**
 * Upsert daily `token_usage` aggregates on the composite key
 * (date, agent, provider, model). Idempotent: re-ingesting a day overwrites it
 * with freshly recomputed totals. Shared by the local `usage:ingest` script
 * (direct write) and `POST /api/usage/ingest` (remote write into whichever DB
 * the deployment is configured for). Returns the number of rows upserted.
 */
export async function upsertTokenUsage(
  rows: InsertTokenUsage[],
): Promise<number> {
  const set = { ...excludedColumns(UPDATE_COLUMNS), updatedAt: sql`now()` };
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    await db
      .insert(tokenUsage)
      .values(chunk)
      .onConflictDoUpdate({ target: [...CONFLICT_TARGET], set });
  }
  return rows.length;
}

export interface RepriceResult {
  /** Rows that were `NULL`-cost going in. */
  scanned: number;
  /** Rows that now resolve to a price and were updated. */
  repriced: number;
  /** Rows still unpriceable (e.g. legacy `unknown`, or a model no pricing DB lists). */
  stillUnpriced: number;
}

/**
 * Recompute cost for every `NULL`-cost row from its *stored* token columns using
 * current pricing, and persist the ones that now resolve.
 *
 * A row's cost is `NULL` when the model had no price at ingest time (models.dev
 * had not yet listed it). The ingest upsert self-heals such a row on the next
 * run — but only while its source log still exists; once the log is pruned the
 * parser stops regenerating that (date, agent, provider, model) key, leaving a
 * permanently stale-`NULL` orphan that re-ingesting can never reach. This pass
 * is log-independent: it reprices straight from the persisted aggregate, so an
 * orphan heals as soon as pricing catches up. Run after each ingest.
 */
export async function repriceUnpricedTokenUsage(
  pricing: Pricing,
): Promise<RepriceResult> {
  const rows = await db
    .select()
    .from(tokenUsage)
    .where(isNull(tokenUsage.costUsd));

  let repriced = 0;
  let stillUnpriced = 0;
  for (const row of rows) {
    const tokens: TokenBreakdown = {
      input: row.inputTokens,
      output: row.outputTokens,
      cacheRead: row.cacheReadTokens,
      cacheWrite: row.cacheWriteTokens,
      reasoning: row.reasoningTokens,
    };
    const cost = pricing.costOf(tokens, row.model, {
      agent: row.agent,
      provider: row.provider,
    });
    if (cost === null) {
      stillUnpriced++;
      continue;
    }
    // `costUsd IS NULL` guards against a concurrent ingest that upserted this
    // same key (with fresh tokens + a real cost) between the select above and
    // this write — without it, we'd clobber the newer cost with one computed
    // from now-stale token counts. The narrowed WHERE makes the write a no-op
    // in that race instead of a silent overwrite.
    const updated = await db
      .update(tokenUsage)
      .set({ costUsd: cost.toFixed(6), updatedAt: sql`now()` })
      .where(
        and(
          eq(tokenUsage.date, row.date),
          eq(tokenUsage.agent, row.agent),
          eq(tokenUsage.provider, row.provider),
          eq(tokenUsage.model, row.model),
          isNull(tokenUsage.costUsd),
        ),
      )
      .returning({ date: tokenUsage.date });
    if (updated.length > 0) {
      repriced++;
    }
  }

  return { scanned: rows.length, repriced, stillUnpriced };
}

/**
 * Build the public `UsageProfile` from the daily `token_usage` aggregates.
 *
 * Pure read (no mutations). All cost arithmetic treats a `null` `costUsd` as
 * N.A. — it is excluded from sums rather than counted as $0, and a group whose
 * rows are *all* N.A. (e.g. the legacy Codex `unknown` model) reports `null`.
 */
export async function getUsageProfile(): Promise<UsageProfile> {
  "use cache";
  // Data only changes on a manual local `pnpm usage:ingest`; refresh ~daily.
  cacheLife("days");
  cacheTag("usage");

  const rows = await db
    .select()
    .from(tokenUsage)
    .orderBy(
      asc(tokenUsage.date),
      asc(tokenUsage.agent),
      asc(tokenUsage.model),
    );

  if (rows.length === 0) {
    return emptyProfile();
  }

  // --- Fold rows into per-day aggregates ------------------------------------
  const dayMap = new Map<string, DayAggregate>();
  const agentTotals = new Map<string, RollupAggregate>();
  const providerTotals = new Map<string, RollupAggregate>();
  const modelTotals = new Map<string, RollupAggregate>();
  const tokenMix = emptyTokenBreakdown();
  let lastUpdated = rows[0].updatedAt;

  for (const row of rows) {
    if (row.updatedAt > lastUpdated) lastUpdated = row.updatedAt;

    addTokens(tokenMix, row);

    const day = getOrCreateDay(dayMap, row.date);
    day.tokens += row.totalTokens;
    day.messages += row.messages;
    day.costValues.push(row.costUsd);
    addTokens(day.breakdown, row);

    addToRollup(getOrCreateRollup(day.agents, row.agent), row);
    addToRollup(getOrCreateRollup(agentTotals, row.agent), row);
    addToRollup(getOrCreateRollup(providerTotals, row.provider), row);
    addToRollup(getOrCreateRollup(modelTotals, row.model), row);
  }

  // --- Dense day array (fill gaps) + intensity scale ------------------------
  const activeTokenTotals = [...dayMap.values()]
    .map((day) => day.tokens)
    .filter((tokens) => tokens > 0)
    .sort((a, b) => a - b);
  const intensityOf = makeIntensityScale(activeTokenTotals);

  const firstDate = rows[0].date;
  const lastDate = rows[rows.length - 1].date;
  const contributions = buildDenseContributions(
    dayMap,
    firstDate,
    lastDate,
    intensityOf,
  );

  // --- Breakdowns, years, summary ------------------------------------------
  const trendDates = sparklineDates(firstDate, lastDate);
  const byAgent = rollupRows(agentTotals, trendDates);
  const byProvider = rollupRows(providerTotals, trendDates);
  const byModel = rollupRows(modelTotals, trendDates);
  const years = buildYears(contributions);
  const summary = buildSummary(contributions, byAgent, byProvider, byModel);

  return {
    summary,
    years,
    contributions,
    byAgent,
    byProvider,
    byModel,
    tokenMix,
    lastUpdated: lastUpdated.toISOString(),
  };
}

// --- Internal aggregation shapes --------------------------------------------

interface RollupAggregate {
  tokens: number;
  messages: number;
  costValues: (string | null)[];
  dailyTokens: Map<string, number>;
  providers: Set<string>;
}

interface DayAggregate {
  date: string;
  tokens: number;
  messages: number;
  costValues: (string | null)[];
  breakdown: TokenBreakdown;
  agents: Map<string, RollupAggregate>;
}

function emptyTokenBreakdown(): TokenBreakdown {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 };
}

function getOrCreateDay(
  map: Map<string, DayAggregate>,
  date: string,
): DayAggregate {
  let day = map.get(date);
  if (!day) {
    day = {
      date,
      tokens: 0,
      messages: 0,
      costValues: [],
      breakdown: emptyTokenBreakdown(),
      agents: new Map(),
    };
    map.set(date, day);
  }
  return day;
}

function getOrCreateRollup(
  map: Map<string, RollupAggregate>,
  key: string,
): RollupAggregate {
  let rollup = map.get(key);
  if (!rollup) {
    rollup = {
      tokens: 0,
      messages: 0,
      costValues: [],
      dailyTokens: new Map(),
      providers: new Set(),
    };
    map.set(key, rollup);
  }
  return rollup;
}

function addToRollup(
  rollup: RollupAggregate,
  row: typeof tokenUsage.$inferSelect,
): void {
  rollup.tokens += row.totalTokens;
  rollup.messages += row.messages;
  rollup.costValues.push(row.costUsd);
  rollup.providers.add(row.provider);
  rollup.dailyTokens.set(
    row.date,
    (rollup.dailyTokens.get(row.date) ?? 0) + row.totalTokens,
  );
}

function addTokens(
  breakdown: TokenBreakdown,
  row: typeof tokenUsage.$inferSelect,
): void {
  breakdown.input += row.inputTokens;
  breakdown.output += row.outputTokens;
  breakdown.cacheRead += row.cacheReadTokens;
  breakdown.cacheWrite += row.cacheWriteTokens;
  breakdown.reasoning += row.reasoningTokens;
}

/** Sum priced values; `null` if every value is N.A. (none priced). */
function sumCost(values: (string | null)[]): Cost {
  let total = 0;
  let priced = false;
  for (const value of values) {
    if (value !== null) {
      total += Number(value);
      priced = true;
    }
  }
  return priced ? total : null;
}

// --- Intensity (quantile buckets of daily token totals) ---------------------

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next === undefined
    ? sorted[base]
    : sorted[base] + rest * (next - sorted[base]);
}

function makeIntensityScale(
  sortedActiveTokens: number[],
): (tokens: number) => 0 | 1 | 2 | 3 | 4 {
  const p25 = quantile(sortedActiveTokens, 0.25);
  const p50 = quantile(sortedActiveTokens, 0.5);
  const p75 = quantile(sortedActiveTokens, 0.75);
  return (tokens: number) => {
    if (tokens <= 0) return 0;
    if (tokens <= p25) return 1;
    if (tokens <= p50) return 2;
    if (tokens <= p75) return 3;
    return 4;
  };
}

// --- Dense contribution array -----------------------------------------------

function buildDenseContributions(
  dayMap: Map<string, DayAggregate>,
  firstDate: string,
  lastDate: string,
  intensityOf: (tokens: number) => 0 | 1 | 2 | 3 | 4,
): DayContribution[] {
  const start = parseISO(firstDate);
  const totalDays = differenceInCalendarDays(parseISO(lastDate), start) + 1;
  const contributions: DayContribution[] = [];

  for (let offset = 0; offset < totalDays; offset++) {
    const date = format(addDays(start, offset), "yyyy-MM-dd");
    const day = dayMap.get(date);
    if (!day) {
      contributions.push({
        date,
        totals: { tokens: 0, cost: 0, messages: 0 },
        intensity: 0,
        tokenBreakdown: emptyTokenBreakdown(),
        agents: [],
      });
      continue;
    }

    const agents: AgentDayBreakdown[] = [...day.agents.entries()]
      .map(([agent, rollup]) => ({
        agent,
        tokens: rollup.tokens,
        cost: sumCost(rollup.costValues),
        messages: rollup.messages,
      }))
      .sort((a, b) => b.tokens - a.tokens);

    contributions.push({
      date,
      totals: {
        tokens: day.tokens,
        cost: sumCost(day.costValues),
        messages: day.messages,
      },
      intensity: intensityOf(day.tokens),
      tokenBreakdown: day.breakdown,
      agents,
    });
  }

  return contributions;
}

// --- Breakdown rows, years, summary -----------------------------------------

/** Trailing window of the per-row trend sparkline, in days. */
const SPARKLINE_DAYS = 90;

/** Dense daily dates for the sparkline window, clamped to the data range. */
function sparklineDates(firstDate: string, lastDate: string): string[] {
  const end = parseISO(lastDate);
  const span = Math.min(
    SPARKLINE_DAYS,
    differenceInCalendarDays(end, parseISO(firstDate)) + 1,
  );
  return Array.from({ length: span }, (_, offset) =>
    format(addDays(end, offset - (span - 1)), "yyyy-MM-dd"),
  );
}

function rollupRows(
  map: Map<string, RollupAggregate>,
  dates: string[],
): UsageBreakdownRow[] {
  return [...map.entries()]
    .map(([key, rollup]) => {
      const cost = sumCost(rollup.costValues);
      const providers = [...rollup.providers].sort();
      return {
        key,
        provider: providers.length === 1 ? providers[0] : null,
        providers,
        tokens: rollup.tokens,
        cost,
        costPerMillionTokens:
          cost !== null && rollup.tokens > 0
            ? (cost / rollup.tokens) * 1_000_000
            : null,
        messages: rollup.messages,
        sparkline: dates.map((date) => rollup.dailyTokens.get(date) ?? 0),
      };
    })
    .sort((a, b) => b.tokens - a.tokens);
}

function buildYears(contributions: DayContribution[]): YearSummary[] {
  const years = new Map<string, YearSummary>();
  for (const day of contributions) {
    if (day.totals.tokens <= 0) continue;
    const year = day.date.slice(0, 4);
    let summary = years.get(year);
    if (!summary) {
      summary = {
        year,
        totalTokens: 0,
        totalCost: 0,
        range: { start: day.date, end: day.date },
      };
      years.set(year, summary);
    }
    summary.totalTokens += day.totals.tokens;
    if (day.totals.cost !== null) summary.totalCost += day.totals.cost;
    if (day.date < summary.range.start) summary.range.start = day.date;
    if (day.date > summary.range.end) summary.range.end = day.date;
  }
  return [...years.values()].sort((a, b) => a.year.localeCompare(b.year));
}

function buildSummary(
  contributions: DayContribution[],
  byAgent: UsageBreakdownRow[],
  byProvider: UsageBreakdownRow[],
  byModel: UsageBreakdownRow[],
): UsageSummary {
  let totalTokens = 0;
  let totalCost = 0;
  let maxCostInSingleDay = 0;
  let activeDays = 0;
  let bestDay: UsageSummary["bestDay"] = null;
  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  for (const day of contributions) {
    const dayCost = day.totals.cost ?? 0;
    totalTokens += day.totals.tokens;
    totalCost += dayCost;

    if (day.totals.tokens > 0) {
      activeDays += 1;
      runningStreak += 1;
      if (runningStreak > longestStreak) longestStreak = runningStreak;
      if (dayCost > maxCostInSingleDay) maxCostInSingleDay = dayCost;
      if (!bestDay || dayCost > bestDay.cost) {
        bestDay = { date: day.date, cost: dayCost, tokens: day.totals.tokens };
      }
    } else {
      runningStreak = 0;
    }
  }
  // Current streak = trailing run of active days at the end of the range.
  currentStreak = runningStreak;

  return {
    totalTokens,
    totalCost,
    totalDays: contributions.length,
    activeDays,
    averagePerDay: activeDays > 0 ? totalCost / activeDays : 0,
    maxCostInSingleDay,
    agents: byAgent.map((row) => row.key),
    providers: byProvider.map((row) => row.key),
    models: byModel.map((row) => row.key),
    currentStreak,
    longestStreak,
    bestDay,
    favouriteModel: byModel[0]?.key ?? null,
  };
}

function emptyProfile(): UsageProfile {
  return {
    summary: {
      totalTokens: 0,
      totalCost: 0,
      totalDays: 0,
      activeDays: 0,
      averagePerDay: 0,
      maxCostInSingleDay: 0,
      agents: [],
      providers: [],
      models: [],
      currentStreak: 0,
      longestStreak: 0,
      bestDay: null,
      favouriteModel: null,
    },
    years: [],
    contributions: [],
    byAgent: [],
    byProvider: [],
    byModel: [],
    tokenMix: emptyTokenBreakdown(),
    lastUpdated: null,
  };
}
