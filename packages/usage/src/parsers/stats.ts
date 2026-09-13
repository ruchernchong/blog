import type { UsageEvent } from "../types";

/** Per-agent parse inventory. Token fields are sums of parsed events. */
export interface ParserStats {
  agent: string;
  durationMs: number;
  files: number;
  bytes: number;
  events: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
}

export interface AgentParseResult {
  events: UsageEvent[];
  files: number;
  bytes: number;
}

export function statsFromParse(input: {
  agent: string;
  events: UsageEvent[];
  files: number;
  bytes: number;
  durationMs: number;
}): ParserStats {
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheWriteTokens = 0;
  let reasoningTokens = 0;

  for (const event of input.events) {
    inputTokens += event.tokens.input;
    outputTokens += event.tokens.output;
    cacheReadTokens += event.tokens.cacheRead;
    cacheWriteTokens += event.tokens.cacheWrite;
    reasoningTokens += event.tokens.reasoning;
  }

  return {
    agent: input.agent,
    durationMs: Math.round(input.durationMs),
    files: input.files,
    bytes: input.bytes,
    events: input.events.length,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    reasoningTokens,
  };
}

const COLUMNS = [
  "agent",
  "ms",
  "files",
  "bytes",
  "events",
  "input",
  "output",
  "cacheRead",
  "cacheWrite",
  "reasoning",
] as const;

/** Fixed-width table for CLI output. */
export function formatParserStatsTable(stats: ParserStats[]): string {
  const rows = stats.map((row) => [
    row.agent,
    String(row.durationMs),
    String(row.files),
    String(row.bytes),
    String(row.events),
    String(row.inputTokens),
    String(row.outputTokens),
    String(row.cacheReadTokens),
    String(row.cacheWriteTokens),
    String(row.reasoningTokens),
  ]);
  const widths = COLUMNS.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );
  const line = (cells: string[]) =>
    cells.map((cell, index) => cell.padEnd(widths[index])).join("  ");
  return [line([...COLUMNS]), ...rows.map(line)].join("\n");
}
