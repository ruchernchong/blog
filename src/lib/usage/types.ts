/**
 * Shared types for the token-usage feature.
 *
 * `UsageEvent` is the flat unit produced by parsers (one priced message/turn).
 * `UsageProfile` is the single object the public `/usage` page renders from,
 * built by the aggregation query from daily `token_usage` rows.
 */

/** Known agents. Parsers self-register; this is just for nicer typing/labels. */
export type Agent = "claude" | "codex";

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
  models: string[];
  currentStreak: number;
  longestStreak: number;
  bestDay: BestDay | null;
  favouriteModel: string | null;
}

/** Per-agent and per-model rollups for the breakdown charts. */
export interface UsageBreakdownRow {
  key: string;
  tokens: number;
  cost: Cost;
  messages: number;
}

export interface UsageProfile {
  summary: UsageSummary;
  years: YearSummary[];
  contributions: DayContribution[];
  byAgent: UsageBreakdownRow[];
  byModel: UsageBreakdownRow[];
  /** All-time tokens split by category, for the token-mix bar. */
  tokenMix: TokenBreakdown;
  /** ISO timestamp of the most recent ingest, or null if no data. */
  lastUpdated: string | null;
}
