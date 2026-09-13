import { performance } from "node:perf_hooks";
import type { UsageEvent } from "../types";
import * as claude from "./claude.ts";
import * as codex from "./codex.ts";
import * as opencode from "./opencode.ts";
import type { AgentParseResult, ParserStats } from "./stats.ts";
import { statsFromParse } from "./stats.ts";

export type { AgentParseResult, ParserStats } from "./stats.ts";
export { formatParserStatsTable, statsFromParse } from "./stats.ts";

export interface AgentParser {
  /** Stable agent key stored in the DB (e.g. "claude", "codex"). */
  name: string;
  /** Whether this agent's log store exists on the current machine. */
  detect: () => Promise<boolean>;
  /** Parse all available logs into events plus a source inventory. */
  parse: () => Promise<AgentParseResult>;
}

/** All known parsers. Add a new agent by appending one module here. */
const PARSERS: AgentParser[] = [
  { name: "claude", detect: claude.detect, parse: claude.parse },
  { name: "codex", detect: codex.detect, parse: codex.parse },
  { name: "opencode", detect: opencode.detect, parse: opencode.parse },
];

/** Parsers whose log store actually exists on this machine. */
export async function discoverAgents(): Promise<AgentParser[]> {
  const available: AgentParser[] = [];
  for (const parser of PARSERS) {
    if (await parser.detect()) available.push(parser);
  }
  return available;
}

/** Parse every available agent into events plus per-agent inventories. */
export async function parseAllAgents(): Promise<{
  agents: string[];
  events: UsageEvent[];
  stats: ParserStats[];
}> {
  const available = await discoverAgents();
  const events: UsageEvent[] = [];
  const stats: ParserStats[] = [];

  for (const parser of available) {
    const started = performance.now();
    const result = await parser.parse();
    events.push(...result.events);
    stats.push(
      statsFromParse({
        agent: parser.name,
        events: result.events,
        files: result.files,
        bytes: result.bytes,
        durationMs: performance.now() - started,
      }),
    );
  }

  return {
    agents: available.map((parser) => parser.name),
    events,
    stats,
  };
}
