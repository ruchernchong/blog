import { PERIOD_LENGTHS } from "@workspace/usage/period-comparison";
import {
  parseAsBoolean,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const USAGE_BREAKDOWN_VIEWS = ["model", "provider", "agent"] as const;

export type UsageBreakdownView = (typeof USAGE_BREAKDOWN_VIEWS)[number];

export const USAGE_STACK_VIEWS = ["model", "agent"] as const;

export type UsageStackView = (typeof USAGE_STACK_VIEWS)[number];

export const USAGE_SORT_COLUMNS = [
  "key",
  "provider",
  "tokens",
  "cost",
  "costPerMillionTokens",
  "messages",
] as const;

export type UsageSortColumn = (typeof USAGE_SORT_COLUMNS)[number];

/** Shared by the `useQueryState(s)` calls in the usage client components. */
export const usageParsers = {
  /**
   * Calendar year shown in the heatmap. Defaults to the current year so it is
   * kept out of the URL; the heatmap falls back to the newest year with data
   * when the requested one has none.
   */
  year: parseAsString.withDefault(String(new Date().getFullYear())),
  /** "This period" window length in days. */
  period: parseAsNumberLiteral(PERIOD_LENGTHS).withDefault(30),
  /** Whether the stack-shift chart splits by model or by agent. */
  stack: parseAsStringLiteral(USAGE_STACK_VIEWS).withDefault("model"),
  /** Model id whose profile drawer is open; absent when closed. */
  model: parseAsString,
  /** Active breakdown dataset. */
  view: parseAsStringLiteral(USAGE_BREAKDOWN_VIEWS).withDefault("model"),
  /** Free-text filter over the breakdown rows. */
  q: parseAsString.withDefault(""),
  /** Provider slug to filter by; "all" disables the filter. */
  provider: parseAsString.withDefault("all"),
  /** Only show free (zero or unpriced) rows. */
  free: parseAsBoolean.withDefault(false),
  /** Breakdown sort column and direction. */
  sort: parseAsStringLiteral(USAGE_SORT_COLUMNS).withDefault("tokens"),
  dir: parseAsStringLiteral(["asc", "desc"]).withDefault("desc"),
};
