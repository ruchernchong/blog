/**
 * Shared types for the token-usage feature.
 *
 * `UsageEvent` is the flat unit produced by parsers (one priced message/turn).
 * `UsageProfile` is the single object the public `/usage` page renders from,
 * built by the aggregation query from daily `token_usage` rows.
 */

/** Known agents. Parsers self-register; this is just for nicer typing/labels. */
export type Agent = "claude" | "codex" | "cursor" | "opencode";

/**
 * Inference provider that bills the tokens. Usually derived from the agent, but
 * some agents are multi-provider and carry it per-event (e.g. OpenCode routes to
 * openai, fireworks-ai, ollama, opencode, opencode-go), so this is open-ended.
 */
export type Provider = string;

export interface TokenBreakdown {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
}

/** One parsed, priced unit of usage (a single message/turn) from an agent log. */
export interface UsageEvent {
  /** ISO timestamp of the message. Only the calendar date is ever persisted. */
  ts: string;
  agent: string;
  /**
   * Inference provider that billed this event, when the agent records it
   * per-message (multi-provider agents like OpenCode). Omitted for single-
   * provider agents (claude/codex), whose provider is derived from the agent.
   */
  provider?: string;
  model: string;
  tokens: TokenBreakdown;
}

/**
 * A cost in USD, or `null` when the underlying model(s) could not be priced
 * (rendered as "N.A."). Distinct from a genuine `0`.
 */
export type Cost = number | null;

/** Per-agent slice of a single day, for the heatmap tooltip + breakdowns. */
export interface AgentDayBreakdown {
  agent: string;
  tokens: number;
  cost: Cost;
  messages: number;
}

/** One day in the contribution heatmap. */
export interface DayContribution {
  /** YYYY-MM-DD */
  date: string;
  totals: {
    tokens: number;
    cost: Cost;
    messages: number;
  };
  /** Quantile bucket of daily token total: 0 (none) … 4 (most). */
  intensity: 0 | 1 | 2 | 3 | 4;
  tokenBreakdown: TokenBreakdown;
  agents: AgentDayBreakdown[];
}

export interface YearSummary {
  /** e.g. "2026" */
  year: string;
  totalTokens: number;
  totalCost: number;
  range: { start: string; end: string };
}

export interface BestDay {
  date: string;
  cost: number;
  tokens: number;
}

export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  /** Calendar days spanned by the data (first → last). */
  totalDays: number;
  /** Days with any usage. */
  activeDays: number;
  /** Average cost per active day. */
  averagePerDay: number;
  maxCostInSingleDay: number;
  agents: string[];
  providers: string[];
  models: string[];
  currentStreak: number;
  longestStreak: number;
  bestDay: BestDay | null;
  favouriteModel: string | null;
}

/** Per-agent, per-provider, and per-model rollups for the breakdown charts. */
export interface UsageBreakdownRow {
  key: string;
  /** Provider for model-level rows, or null when the row spans providers. */
  provider: string | null;
  /** All providers included in this rollup, sorted for stable display. */
  providers: string[];
  tokens: number;
  cost: Cost;
  /** Blended rate derived from `cost / tokens`; null when the cost is N.A. */
  costPerMillionTokens: Cost;
  messages: number;
  /** Daily token totals over the trailing sparkline window, oldest first. */
  sparkline: number[];
}

export interface UsageProfile {
  summary: UsageSummary;
  years: YearSummary[];
  contributions: DayContribution[];
  byAgent: UsageBreakdownRow[];
  byProvider: UsageBreakdownRow[];
  byModel: UsageBreakdownRow[];
  /** All-time tokens split by category, for the token-mix bar. */
  tokenMix: TokenBreakdown;
  /**
   * All-time session effort distribution, or `null` when no effort rows exist
   * or no sessions were classified.
   */
  effort: EffortSummary | null;
  /** ISO timestamp of the most recent ingest, or null if no data. */
  lastUpdated: string | null;
}

/**
 * Session count at a single effort level. Levels are open-ended strings
 * (`minimal` | `low` | `medium` | `high` | `xhigh` | `max` | `ultra` | `mixed`
 * | future); counts are **sessions**, not requests or tokens.
 */
export interface EffortLevelCount {
  level: string;
  sessionCount: number;
}

/**
 * All-time effort distribution folded from daily `token_effort_usage` rows.
 * `null` on `UsageProfile` means no effort data (or zero classified sessions).
 */
export interface EffortSummary {
  levels: EffortLevelCount[];
  classifiedSessionCount: number;
  unclassifiedSessionCount: number;
}

/**
 * Known effort levels in display order (lowest → highest). Unknown levels sort
 * after these and before `mixed`.
 */
export const EFFORT_DISPLAY_ORDER = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
  "ultra",
] as const;

const EFFORT_LABELS: Record<string, string> = {
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
  max: "Max",
  ultra: "Ultra",
  mixed: "Mixed",
};

/** Human-readable label for an effort level slug. */
export function effortLevelLabel(level: string): string {
  return (
    EFFORT_LABELS[level] ??
    level.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Compare two effort level slugs for display ordering. */
export function compareEffortLevels(a: string, b: string): number {
  if (a === "mixed" || b === "mixed") {
    if (a === "mixed" && b === "mixed") {
      return 0;
    }
    return a === "mixed" ? 1 : -1;
  }

  const aKnown = (EFFORT_DISPLAY_ORDER as readonly string[]).indexOf(a);
  const bKnown = (EFFORT_DISPLAY_ORDER as readonly string[]).indexOf(b);

  if (aKnown >= 0 && bKnown >= 0) {
    return aKnown - bKnown;
  }
  if (aKnown >= 0) {
    return -1;
  }
  if (bKnown >= 0) {
    return 1;
  }
  return a.localeCompare(b);
}

/** Sort effort level counts into display order (mutates a copy). */
export function sortEffortLevels(
  levels: EffortLevelCount[],
): EffortLevelCount[] {
  return levels.toSorted((a, b) => compareEffortLevels(a.level, b.level));
}

/**
 * Fold daily effort rows into an all-time summary. Returns `null` when there
 * are no rows or zero classified sessions.
 */
export function foldEffortSummary(
  rows: ReadonlyArray<{
    levels: EffortLevelCount[];
    classifiedSessionCount: number;
    unclassifiedSessionCount: number;
  }>,
): EffortSummary | null {
  if (rows.length === 0) {
    return null;
  }

  const levelTotals = new Map<string, number>();
  let classifiedSessionCount = 0;
  let unclassifiedSessionCount = 0;

  for (const row of rows) {
    classifiedSessionCount += row.classifiedSessionCount;
    unclassifiedSessionCount += row.unclassifiedSessionCount;
    for (const { level, sessionCount } of row.levels) {
      levelTotals.set(level, (levelTotals.get(level) ?? 0) + sessionCount);
    }
  }

  if (classifiedSessionCount === 0) {
    return null;
  }

  return {
    levels: sortEffortLevels(
      [...levelTotals.entries()].map(([level, sessionCount]) => ({
        level,
        sessionCount,
      })),
    ),
    classifiedSessionCount,
    unclassifiedSessionCount,
  };
}
