import type { Provider } from "./types";

/**
 * Single source of truth mapping a coding agent to the first-party inference
 * provider that bills its tokens. Provider is functionally derived from the
 * agent (one provider per agent today), so it is denormalised onto each
 * `token_usage` row at ingest rather than stored as part of the key.
 *
 * Consumed by both the ingest fold (to stamp `provider` on each row) and
 * pricing (to resolve a model under its agent's provider on models.dev).
 * Add a new agent's provider here when registering a new parser.
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
