import type { UsageEvent } from "../types";
import * as claude from "./claude";
import * as codex from "./codex";
import * as opencode from "./opencode";

export interface AgentParser {
  /** Stable agent key stored in the DB (e.g. "claude", "codex"). */
  name: string;
  /** Whether this agent's log store exists on the current machine. */
  detect: () => Promise<boolean>;
  /** Parse all available logs into flat usage events. */
  parse: () => Promise<UsageEvent[]>;
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

/** Parse every available agent into a single flat event list. */
export async function parseAllAgents(): Promise<{
  agents: string[];
  events: UsageEvent[];
}> {
  const available = await discoverAgents();
  const events: UsageEvent[] = [];
  for (const parser of available) {
    events.push(...(await parser.parse()));
  }
  return { agents: available.map((parser) => parser.name), events };
}
