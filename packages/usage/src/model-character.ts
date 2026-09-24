import type { Cost, TokenBreakdown } from "./types";

/** Behavioural ratios for one rollup; null where the denominator is zero. */
export interface ModelCharacter {
  /** (output + reasoning) / (input + cacheRead + cacheWrite). */
  outputInputRatio: number | null;
  /** reasoning / (output + reasoning). */
  reasoningShare: number | null;
  /** cacheRead / (input + cacheRead + cacheWrite). */
  cacheHitRate: number | null;
  tokensPerMessage: number | null;
  costPerMessage: Cost;
}

interface CharacterInput {
  tokenBreakdown: TokenBreakdown;
  tokens: number;
  messages: number;
  cost: Cost;
}

const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;

/**
 * Derive a model's "character" from its token split. The five token buckets
 * are exclusive (cached tokens are split out of input, reasoning out of
 * output), so prompt-side and completion-side totals are plain sums.
 */
export function deriveModelCharacter({
  tokenBreakdown,
  tokens,
  messages,
  cost,
}: CharacterInput): ModelCharacter {
  const { input, output, cacheRead, cacheWrite, reasoning } = tokenBreakdown;
  const prompt = input + cacheRead + cacheWrite;
  const completion = output + reasoning;

  return {
    outputInputRatio: ratio(completion, prompt),
    reasoningShare: ratio(reasoning, completion),
    cacheHitRate: ratio(cacheRead, prompt),
    tokensPerMessage: ratio(tokens, messages),
    costPerMessage: cost === null ? null : ratio(cost, messages),
  };
}
