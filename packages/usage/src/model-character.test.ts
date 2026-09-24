import { describe, expect, it } from "vitest";
import { deriveModelCharacter } from "./model-character";

describe("deriveModelCharacter", () => {
  it("should derive ratios from exclusive token buckets", () => {
    expect(
      deriveModelCharacter({
        tokenBreakdown: {
          input: 100,
          output: 30,
          cacheRead: 300,
          cacheWrite: 100,
          reasoning: 10,
        },
        tokens: 540,
        messages: 4,
        cost: 2,
      }),
    ).toEqual({
      outputInputRatio: 40 / 500,
      reasoningShare: 10 / 40,
      cacheHitRate: 300 / 500,
      tokensPerMessage: 135,
      costPerMessage: 0.5,
    });
  });

  it("should return null ratios for zero denominators and unpriced cost", () => {
    expect(
      deriveModelCharacter({
        tokenBreakdown: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          reasoning: 0,
        },
        tokens: 0,
        messages: 0,
        cost: null,
      }),
    ).toEqual({
      outputInputRatio: null,
      reasoningShare: null,
      cacheHitRate: null,
      tokensPerMessage: null,
      costPerMessage: null,
    });
  });
});
