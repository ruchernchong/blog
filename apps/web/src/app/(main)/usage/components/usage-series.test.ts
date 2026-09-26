import { describe, expect, it } from "vitest";
import { OTHER_SERIES_KEY } from "@/lib/usage/weekly-insights";
import {
  describeSeries,
  OTHER_SERIES_COLOR,
  SERIES_COLORS,
} from "./usage-series";

describe("describeSeries", () => {
  it("should assign colours in order, label other, and compute shares", () => {
    expect(
      describeSeries(
        [
          {
            key: "opus",
            tokens: [30, 30],
            members: [{ key: "opus-5", tokens: [30, 30] }],
          },
          { key: "sonnet", tokens: [20, 0] },
          { key: OTHER_SERIES_KEY, tokens: [10, 10] },
        ],
        (key) => key.toUpperCase(),
      ),
    ).toEqual([
      {
        key: "opus",
        label: "OPUS",
        color: SERIES_COLORS[0],
        share: 0.6,
        members: [{ key: "opus-5", label: "OPUS-5" }],
      },
      {
        key: "sonnet",
        label: "SONNET",
        color: SERIES_COLORS[1],
        share: 0.2,
        members: [],
      },
      {
        key: OTHER_SERIES_KEY,
        label: "Other",
        color: OTHER_SERIES_COLOR,
        share: 0.2,
        members: [],
      },
    ]);
  });

  it("should report zero shares when there are no tokens", () => {
    expect(
      describeSeries([{ key: "a", tokens: [0] }], (key) => key)[0].share,
    ).toBe(0);
  });
});
