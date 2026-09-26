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
      }),
    ).toEqual({
      cacheHitRate: 300 / 500,
    });
  });

  it("should return null ratios for zero denominators", () => {
    expect(
      deriveModelCharacter({
        tokenBreakdown: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          reasoning: 0,
        },
      }),
    ).toEqual({
      cacheHitRate: null,
    });
  });
});
