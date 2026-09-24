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

/** A run of narrative text; `highlight` marks the key figures and names. */
export interface UsageNarrativePart {
  text: string;
  highlight?: boolean;
}

/**
 * The hero summary sentence as parts, so the page can set the key figures and
 * names in an accent colour, e.g. "Since March 2025: **4.2B tokens** across
 * **212 active days**, mostly **Claude Opus 4.1** via **Claude Code**. Current
 * streak: **14 days**."
 *
 * Deterministic and template-driven so the page reads the same on every render
 * for the same data. Returns null when there is no usage to describe.
 */
export function buildUsageNarrativeParts({
  summary,
  firstActiveDate,
  topModel,
  topAgent,
}: UsageNarrativeInput): UsageNarrativePart[] | null {
  if (!firstActiveDate || summary.totalTokens <= 0) {
    return null;
  }

  const since = format(parseISO(firstActiveDate), "MMMM yyyy");
  const parts: UsageNarrativePart[] = [
    { text: `Since ${since}: ` },
    { text: `${formatTokens(summary.totalTokens)} tokens`, highlight: true },
    { text: " across " },
    { text: days(summary.activeDays, "active "), highlight: true },
  ];

  if (topModel) {
    parts.push({ text: ", mostly " }, { text: topModel, highlight: true });
    if (topAgent) {
      parts.push(
        { text: " via " },
        { text: agentLabel(topAgent), highlight: true },
      );
    }
  }

  parts.push(
    summary.currentStreak > 0
      ? { text: ". Current streak: " }
      : { text: ". Longest streak: " },
    {
      text: days(
        summary.currentStreak > 0
          ? summary.currentStreak
          : summary.longestStreak,
      ),
      highlight: true,
    },
    { text: "." },
  );

  return parts;
}

/**
 * The hero summary sentence as plain text, e.g. "Since March 2025: 4.2B tokens
 * across 212 active days, mostly Claude Opus 4.1 via Claude Code. Current
 * streak: 14 days." Returns null when there is no usage to describe.
 */
export function buildUsageNarrative(input: UsageNarrativeInput): string | null {
  const parts = buildUsageNarrativeParts(input);
  return parts ? parts.map((part) => part.text).join("") : null;
}
