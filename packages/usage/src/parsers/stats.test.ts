import type { UsageEvent } from "../types";
import { formatParserStatsTable, statsFromParse } from "./stats";

function event(tokens: UsageEvent["tokens"]): UsageEvent {
  return {
    ts: "2026-01-02T00:00:00.000Z",
    agent: "claude",
    model: "x",
    tokens,
  };
}

describe("statsFromParse", () => {
  it("should sum token buckets and count events", () => {
    const stats = statsFromParse({
      agent: "claude",
      files: 3,
      bytes: 1200,
      durationMs: 12.4,
      events: [
        event({
          input: 10,
          output: 4,
          cacheRead: 2,
          cacheWrite: 1,
          reasoning: 0,
        }),
        event({
          input: 5,
          output: 6,
          cacheRead: 0,
          cacheWrite: 3,
          reasoning: 2,
        }),
      ],
    });

    expect(stats).toEqual({
      agent: "claude",
      durationMs: 12,
      files: 3,
      bytes: 1200,
      events: 2,
      inputTokens: 15,
      outputTokens: 10,
      cacheReadTokens: 2,
      cacheWriteTokens: 4,
      reasoningTokens: 2,
    });
  });

  it("should round duration to the nearest millisecond", () => {
    const stats = statsFromParse({
      agent: "codex",
      files: 0,
      bytes: 0,
      durationMs: 1.5,
      events: [],
    });
    expect(stats.durationMs).toBe(2);
    expect(stats.events).toBe(0);
  });
});

describe("formatParserStatsTable", () => {
  it("should render a header and one aligned row", () => {
    const table = formatParserStatsTable([
      {
        agent: "claude",
        durationMs: 10,
        files: 2,
        bytes: 100,
        events: 3,
        inputTokens: 1,
        outputTokens: 2,
        cacheReadTokens: 3,
        cacheWriteTokens: 4,
        reasoningTokens: 5,
      },
    ]);
    const lines = table.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("agent");
    expect(lines[1]).toContain("claude");
    expect(lines[1]).toContain("100");
  });
});
