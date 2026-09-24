import {
  buildPricingFromRegistry,
  type Pricing,
} from "@workspace/usage/pricing";
import {
  type AgentDayBreakdown,
  type Cost,
  type DayContribution,
  foldEffortSummary,
  type ModelDayBreakdown,
  type TokenBreakdown,
  type UsageBreakdownRow,
  type UsageFact,
  type UsageProfile,
  type UsageSummary,
  type YearSummary,
} from "@workspace/usage/types";
import {
  buildCacheTrend,
  buildWeeklyShare,
} from "@workspace/usage/weekly-insights";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import {
  MODEL_PRICING_COLUMNS,
  pricingRowToEntry,
} from "@/lib/queries/model-registry";
import { excludedColumns } from "@/lib/queries/upsert";
import {
  db,
  type InsertTokenEffortUsage,
  type InsertTokenUsage,
  model,
  tokenEffortUsage,
  tokenUsage,
} from "@/schema";

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
 * Composite primary key of `token_effort_usage`.
 */
const EFFORT_CONFLICT_TARGET = [
  tokenEffortUsage.date,
  tokenEffortUsage.agent,
] as const;

/** Columns refreshed from the incoming effort row on conflict. */
const EFFORT_UPDATE_COLUMNS = [
  "levels",
  "classifiedSessionCount",
  "unclassifiedSessionCount",
] as const satisfies (keyof typeof tokenEffortUsage.$inferInsert)[];

/**
 * Upsert daily `token_usage` aggregates on the composite key
 * (date, agent, provider, model). Shared by the local `usage:ingest` script
 * (direct write) and `POST /api/usage/ingest` (remote write into whichever DB
 * the deployment is configured for). Returns the number of rows submitted.
 *
 * **Non-decreasing on conflict.** The DB is the permanent lifetime record, but
 * the ingest clients (e.g. ClaudeMeter) send an absolute snapshot recomputed from
 * the agent logs currently on disk — and those logs are pruned/compacted over
 * time. A blind overwrite would let a partially-pruned day re-send a *smaller*
 * total and ratchet the stored lifetime value down (observed as Opus 4.7 tokens
 * "getting lesser and lesser"). So a day is overwritten only when the incoming
 * snapshot has a larger `totalTokens`, i.e. it is a more complete parse; smaller
 * snapshots are ignored. The whole incoming row wins together (not per-column),
 * which preserves the `input+output+cache = total` invariant and keeps `costUsd`
 * consistent with its tokens. Trade-off: a day that was genuinely over-counted
 * once can no longer be corrected downward via ingest — acceptable for a
 * lifetime-cumulative record that should never shrink.
 */
export async function upsertTokenUsage(
  rows: InsertTokenUsage[],
): Promise<number> {
  const set = {
    ...excludedColumns(tokenUsage, UPDATE_COLUMNS),
    updatedAt: sql`now()`,
  };
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    await db
      .insert(tokenUsage)
      .values(chunk)
      .onConflictDoUpdate({
        target: [...CONFLICT_TARGET],
        set,
        setWhere: sql`excluded.total_tokens > ${tokenUsage.totalTokens}`,
      });
  }
  return rows.length;
}

/**
 * Upsert daily `token_effort_usage` aggregates on `(date, agent)`.
 *
 * Same prune-erosion rationale as {@link upsertTokenUsage}: AgentUsage sends
 * absolute session-count snapshots recomputed from logs that shrink over time.
 * A day is overwritten only when the incoming snapshot has a larger
 * `classifiedSessionCount + unclassifiedSessionCount`. Provided keys only —
 * unspecified dates are never deleted, even when `effortSnapshotComplete` is
 * true on the wire.
 */
export async function upsertTokenEffortUsage(
  rows: InsertTokenEffortUsage[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const set = {
    ...excludedColumns(tokenEffortUsage, EFFORT_UPDATE_COLUMNS),
    updatedAt: sql`now()`,
  };
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    await db
      .insert(tokenEffortUsage)
      .values(chunk)
      .onConflictDoUpdate({
        target: [...EFFORT_CONFLICT_TARGET],
        set,
        setWhere: sql`(excluded.classified_session_count + excluded.unclassified_session_count) > (${tokenEffortUsage.classifiedSessionCount} + ${tokenEffortUsage.unclassifiedSessionCount})`,
      });
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
    const cost = pricing.costOf(tokensOf(row), row.model, {
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
 * Build the public `UsageProfile` from the daily `token_usage` aggregates
 * (and optional `token_effort_usage` session-level effort rows).
 *
 * Pure read (no mutations). Display cost is `costOf(stored tokens, current
 * registry)` — API equivalent at provider list prices, not an invoice. A
 * `null` cost is N.A.: excluded from sums rather than counted as $0, and a
 * group whose rows are *all* N.A. (e.g. the legacy Codex `unknown` model)
 * reports `null`. Stored `costUsd` is unused here; it remains a parity net
 * for ingest/reprice.
 */
export async function getUsageProfile(): Promise<UsageProfile> {
  "use cache";
  // Data only changes on a manual local `pnpm usage:ingest`; refresh ~daily.
  cacheLife("days");
  cacheTag("usage");

  // neon-http: one HTTP round-trip via Neon's batch API. The model select is
  // in this batch (not Promise.all / loadPricing) so we do not add a round-trip
  // and do not import models.ts (which already imports this module).
  const [rows, effortRows, modelRows] = await db.batch([
    db
      .select()
      .from(tokenUsage)
      .orderBy(
        asc(tokenUsage.date),
        asc(tokenUsage.agent),
        asc(tokenUsage.model),
      ),
    db.select().from(tokenEffortUsage),
    db.select(MODEL_PRICING_COLUMNS).from(model),
  ]);

  if (rows.length === 0) {
    return emptyProfile();
  }

  const pricing = buildPricingFromRegistry(modelRows.map(pricingRowToEntry));

  // --- Fold rows into per-day aggregates ------------------------------------
  const dayMap = new Map<string, DayAggregate>();
  const agentTotals = new Map<string, RollupAggregate>();
  const providerTotals = new Map<string, RollupAggregate>();
  const modelTotals = new Map<string, RollupAggregate>();
  const tokenMix = emptyTokenBreakdown();
  const facts: UsageFact[] = [];
  let lastUpdated = rows[0].updatedAt;

  for (const row of rows) {
    if (row.updatedAt > lastUpdated) lastUpdated = row.updatedAt;

    addTokens(tokenMix, row);

    const priceOpts = { agent: row.agent, provider: row.provider };
    const tokens = tokensOf(row);
    const cost = pricing.costOf(tokens, row.model, priceOpts);
    // Alias ids (e.g. grok-4.6-build) fold into their target so one model is
    // one row; the stored id is untouched.
    const modelKey = pricing.canonicalModel(row.model, priceOpts);

    facts.push({
      date: row.date,
      agent: row.agent,
      provider: row.provider,
      model: modelKey,
      tokens,
      totalTokens: row.totalTokens,
      messages: row.messages,
      cost,
      cacheSavings: cacheSavingsOf(pricing, row, priceOpts),
    });

    const day = getOrCreateDay(dayMap, row.date);
    day.tokens += row.totalTokens;
    day.messages += row.messages;
    day.costValues.push(cost);
    addTokens(day.breakdown, row);

    addToRollup(getOrCreateRollup(day.agents, row.agent), row, cost);
    addToRollup(getOrCreateRollup(day.models, modelKey), row, cost);
    addToRollup(getOrCreateRollup(agentTotals, row.agent), row, cost);
    addToRollup(getOrCreateRollup(providerTotals, row.provider), row, cost);
    addToRollup(getOrCreateRollup(modelTotals, modelKey), row, cost);
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
  const weeklyShare = buildWeeklyShare(facts);
  const cacheTrend = buildCacheTrend(facts);

  for (const row of effortRows) {
    if (row.updatedAt > lastUpdated) {
      lastUpdated = row.updatedAt;
    }
  }

  return {
    summary,
    years,
    contributions,
    byAgent,
    byProvider,
    byModel,
    tokenMix,
    weeklyShare,
    cacheTrend,
    effort: foldEffortSummary(effortRows),
    lastUpdated: lastUpdated.toISOString(),
  };
}

// --- Internal aggregation shapes --------------------------------------------

interface RollupAggregate {
  tokens: number;
  messages: number;
  costValues: (number | null)[];
  dailyTokens: Map<string, number>;
  providers: Set<string>;
  agents: Set<string>;
  breakdown: TokenBreakdown;
}

interface DayAggregate {
  date: string;
  tokens: number;
  messages: number;
  costValues: (number | null)[];
  breakdown: TokenBreakdown;
  agents: Map<string, RollupAggregate>;
  models: Map<string, RollupAggregate>;
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
      models: new Map(),
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
      agents: new Set(),
      breakdown: emptyTokenBreakdown(),
    };
    map.set(key, rollup);
  }
  return rollup;
}

function addToRollup(
  rollup: RollupAggregate,
  row: typeof tokenUsage.$inferSelect,
  cost: number | null,
): void {
  rollup.tokens += row.totalTokens;
  rollup.messages += row.messages;
  rollup.costValues.push(cost);
  rollup.providers.add(row.provider);
  rollup.agents.add(row.agent);
  addTokens(rollup.breakdown, row);
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

function tokensOf(row: typeof tokenUsage.$inferSelect): TokenBreakdown {
  return {
    input: row.inputTokens,
    output: row.outputTokens,
    cacheRead: row.cacheReadTokens,
    cacheWrite: row.cacheWriteTokens,
    reasoning: row.reasoningTokens,
  };
}

/**
 * What a row's cache reads would have cost at the full input rate, minus what
 * they cost at the cache-read rate. `null` when the model is unpriced.
 */
function cacheSavingsOf(
  pricing: Pricing,
  row: typeof tokenUsage.$inferSelect,
  priceOpts: { agent: string; provider: string },
): Cost {
  if (row.cacheReadTokens === 0) {
    return pricing.priceFor(row.model, priceOpts) ? 0 : null;
  }
  const asInput = pricing.costOf(
    { ...emptyTokenBreakdown(), input: row.cacheReadTokens },
    row.model,
    priceOpts,
  );
  const asCacheRead = pricing.costOf(
    { ...emptyTokenBreakdown(), cacheRead: row.cacheReadTokens },
    row.model,
    priceOpts,
  );
  return asInput === null || asCacheRead === null
    ? null
    : asInput - asCacheRead;
}

/** Sum priced values; `null` if every value is N.A. (none priced). */
function sumCost(values: (number | null)[]): Cost {
  let total = 0;
  let priced = false;
  for (const value of values) {
    if (value !== null) {
      total += value;
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

/**
 * Models kept per day. Every day of the range ships to the client with the
 * heatmap, so the tail is trimmed: the top few carry the story, and a day with
 * more than this is a day where the rest are rounding errors.
 */
const MODELS_PER_DAY = 4;

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
        models: [],
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

    const models: ModelDayBreakdown[] = [...day.models.entries()]
      .map(([model, rollup]) => ({
        model,
        tokens: rollup.tokens,
        cost: sumCost(rollup.costValues),
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, MODELS_PER_DAY);

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
      models,
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
      const activeDates = [...rollup.dailyTokens.entries()]
        .filter(([, tokens]) => tokens > 0)
        .map(([date]) => date)
        .sort();
      // A rollup of only zero-token rows still needs a date span.
      const spanDates =
        activeDates.length > 0
          ? activeDates
          : [...rollup.dailyTokens.keys()].sort();
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
        firstUsed: spanDates[0],
        lastUsed: spanDates[spanDates.length - 1],
        activeDays: activeDates.length,
        agents: [...rollup.agents].sort(),
        tokenBreakdown: rollup.breakdown,
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
    weeklyShare: { weeks: [], models: [], agents: [] },
    cacheTrend: [],
    effort: null,
    lastUpdated: null,
  };
}
