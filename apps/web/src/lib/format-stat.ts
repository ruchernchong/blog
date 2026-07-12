/**
 * Compact stat formatting for the homepage counters, e.g. 48.2k, 1,842,
 * 12.41B. Values below 10,000 render as plain locale numbers so counts like
 * contributions keep their thousands separator.
 */
export const formatStat = (value: number): string => {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }

  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }

  if (value >= 1e4) {
    return `${(value / 1e3).toFixed(1)}k`;
  }

  return Math.round(value).toLocaleString("en-SG");
};
