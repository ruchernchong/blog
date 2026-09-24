import { format, parseISO } from "date-fns";
import { formatNumber, formatTokens } from "./format";
import type { UsageSummary } from "./types";

/** Human names for known coding agents; unknown agents fall back to their id. */
const AGENT_LABELS: Record<string, string> = {
  claude: "Claude Code",
  codex: "Codex",
  cursor: "Cursor",
  grok: "Grok",
  opencode: "OpenCode",
};

export function agentLabel(agent: string): string {
  return AGENT_LABELS[agent] ?? agent;
}

export interface UsageNarrativeInput {
  summary: Pick<
    UsageSummary,
    "totalTokens" | "activeDays" | "currentStreak" | "longestStreak"
  >;
  /** First day with any usage (YYYY-MM-DD), or null when there is none. */
  firstActiveDate: string | null;
  /** Display name of the model with the most tokens. */
  topModel: string | null;
  /** Agent id with the most tokens. */
  topAgent: string | null;
}

function days(count: number, qualifier = ""): string {
  const unit = count === 1 ? "day" : "days";
  return `${formatNumber(count)} ${qualifier}${unit}`;
}

/**
 * The hero summary sentence, e.g. "Since March 2025: 4.2B tokens across 212
 * active days, mostly Claude Opus 4.1 via Claude Code. Current streak: 14 days."
 *
 * Deterministic and template-driven so the page reads the same on every render
 * for the same data. Returns null when there is no usage to describe.
 */
export function buildUsageNarrative({
  summary,
  firstActiveDate,
  topModel,
  topAgent,
}: UsageNarrativeInput): string | null {
  if (!firstActiveDate || summary.totalTokens <= 0) {
    return null;
  }

  const since = format(parseISO(firstActiveDate), "MMMM yyyy");
  const volume = `${formatTokens(summary.totalTokens)} tokens across ${days(summary.activeDays, "active ")}`;

  let mostly = "";
  if (topModel && topAgent) {
    mostly = `, mostly ${topModel} via ${agentLabel(topAgent)}`;
  } else if (topModel) {
    mostly = `, mostly ${topModel}`;
  }

  const streak =
    summary.currentStreak > 0
      ? `Current streak: ${days(summary.currentStreak)}.`
      : `Longest streak: ${days(summary.longestStreak)}.`;

  return `Since ${since}: ${volume}${mostly}. ${streak}`;
}
