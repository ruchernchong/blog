import type { Cost } from "./types";

/**
 * Shared, locale-aware formatters for the usage page (en-SG). Safe to import in
 * both server and client components.
 */

const compactNumber = new Intl.NumberFormat("en-SG", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const fullNumber = new Intl.NumberFormat("en-SG");

const currency = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "USD",
});

const compactCurrency = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact token count, e.g. 3.22B, 628.5M, 12.3K. */
export const formatTokens = (tokens: number): string =>
  compactNumber.format(tokens);

/** Full integer with thousands separators. */
export const formatNumber = (value: number): string => fullNumber.format(value);

/** Full currency, e.g. $2,202.87. */
export const formatCurrency = (value: number): string => currency.format(value);

/** Compact currency, e.g. $2.2K. */
export const formatCurrencyCompact = (value: number): string =>
  compactCurrency.format(value);

/** Currency, or "N.A." when the cost could not be priced. */
export const formatCost = (cost: Cost): string =>
  cost === null ? "N.A." : currency.format(cost);
