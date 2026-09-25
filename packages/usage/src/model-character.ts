import type { TokenBreakdown } from "./types";

/** Behavioural ratios for one rollup; null where the denominator is zero. */
export interface ModelCharacter {
  /** cacheRead / (input + cacheRead + cacheWrite). */
  cacheHitRate: number | null;
}

interface CharacterInput {
  tokenBreakdown: TokenBreakdown;
}

const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;

/**
 * Derive a model's "character" from its token split. The five token buckets
 * are exclusive (cached tokens are split out of input, reasoning out of
 * output), so the prompt-side total is a plain sum.
 */
export function deriveModelCharacter({
  tokenBreakdown,
}: CharacterInput): ModelCharacter {
  const { input, cacheRead, cacheWrite } = tokenBreakdown;
  const prompt = input + cacheRead + cacheWrite;

  return {
    cacheHitRate: ratio(cacheRead, prompt),
  };
}
