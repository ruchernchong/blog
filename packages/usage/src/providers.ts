import type { Provider } from "./types";

/**
 * Maps a single-provider coding agent to the inference provider that bills its
 * tokens. Used as a fallback for agents that do NOT record a provider per event.
 *
 * Multi-provider agents (e.g. OpenCode, which routes to openai, fireworks-ai,
 * ollama, opencode, opencode-go) instead carry the provider on each usage event,
 * so they are not listed here — see {@link resolveProvider}.
 *
 * Consumed by the ingest fold (to stamp `provider` on each row) and pricing (to
 * resolve a model under its provider on models.dev). Add a single-provider
 * agent's provider here when registering its parser.
 */
export const AGENT_PROVIDERS: Record<string, Provider> = {
  claude: "anthropic",
  codex: "openai",
};

/**
 * Resolve the provider for an agent. Falls back to the agent key itself for an
 * unmapped agent so the (notNull) column is never empty — callers can still see
 * which agent went unmapped rather than silently collapsing to "unknown".
 */
export function providerForAgent(agent: string): string {
  return AGENT_PROVIDERS[agent] ?? agent;
}

/**
 * Resolve the provider for a usage event: the per-event provider when the agent
 * records one (multi-provider agents), else derived from the agent. Never empty,
 * so the (notNull) `provider` column / primary key is always satisfied.
 */
export function resolveProvider(event: {
  agent: string;
  provider?: string;
}): string {
  return event.provider || providerForAgent(event.agent);
}
