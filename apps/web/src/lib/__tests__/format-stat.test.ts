import { describe, expect, it } from "vitest";
import { formatStat } from "@/lib/format-stat";

describe("formatStat", () => {
  it("should format billions with two decimals and a B suffix", () => {
    expect(formatStat(12_410_000_000)).toBe("12.41B");
  });

  it("should format millions with one decimal and an M suffix", () => {
    expect(formatStat(1_500_000)).toBe("1.5M");
  });

  it("should format tens of thousands with one decimal and a k suffix", () => {
    expect(formatStat(48_200)).toBe("48.2k");
  });

  it("should format values below ten thousand as locale numbers", () => {
    expect(formatStat(1842)).toBe("1,842");
  });

  it("should format small values without separators", () => {
    expect(formatStat(964)).toBe("964");
  });

  it("should round fractional values", () => {
    expect(formatStat(963.6)).toBe("964");
  });

  it("should format zero as 0", () => {
    expect(formatStat(0)).toBe("0");
  });
});
