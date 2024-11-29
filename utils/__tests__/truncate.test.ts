import { describe, it, expect } from "vitest";
import { truncate } from "../truncate";

describe("truncate", () => {
  it("returns original string if shorter than maxLength", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("uses default maxLength of 160", () => {
    const longString = "a".repeat(200);
    const result = truncate(longString);
    expect(result.length).toBe(160);
    expect(result.endsWith("...")).toBe(true);
  });

  it("handles empty string", () => {
    expect(truncate("")).toBe("");
  });
});
