import { AGENT_PROVIDERS } from "./providers";
import {
  type ModelEntry,
  type ModelsDevApi,
  normaliseModelsDev,
} from "./registry";
import type { TokenBreakdown } from "./types";

/**
 * Model pricing, built from the merged {@link ModelEntry} registry (LiteLLM +
 * models.dev + curated DB overrides). Formerly this module embedded pricing
 * gap-fillers as hardcoded constants; they now live as data in the `model`
 * table (bootstrapped from seed override rows and editable via the MCP tools),
 * so a newly-released model prices automatically once a live source lists it.
 *
 * We resolve each model under its provider first — given explicitly
 * (multi-provider agents like OpenCode) or derived from the agent (Claude →
 * anthropic, Codex → openai) — then fall back to a global lookup. Pricing runs
 * only in the local ingest script and the reprice pass, never in the browser.
 */

/** USD per 1,000,000 tokens for each token kind. */
export interface ModelRate {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

/**
 * How to resolve a model's provider for pricing. Pass `provider` directly for
 * multi-provider agents (OpenCode); `agent` derives it (claude/codex).
 */
export interface PriceOpts {
  agent?: string;
  provider?: string;
}

export interface Pricing {
  priceFor(model: string, opts?: PriceOpts): ModelRate | null;
  /** Cost in USD, or `null` when the model cannot be priced (rendered "N.A."). */
  costOf(
    tokens: TokenBreakdown,
    model: string,
    opts?: PriceOpts,
  ): number | null;
}

function toRate(rate: Partial<ModelRate>): ModelRate | null {
  if (rate.input == null || rate.output == null) return null;
  return {
    input: rate.input,
    output: rate.output,
    cacheRead: rate.cacheRead ?? 0,
    cacheWrite: rate.cacheWrite ?? 0,
  };
}

/**
 * Build a {@link Pricing} from the merged model registry. Pure (no network, no
 * DB) so it can be unit-tested with fixture entries.
 */
export function buildPricingFromRegistry(entries: ModelEntry[]): Pricing {
  // Per-provider lookup, plus a global fallback keyed by bare model id, plus
  // per-provider aliases (e.g. codex-auto-review → gpt-5-codex).
  const byProvider: Record<string, Record<string, ModelRate>> = {};
  const global: Record<string, ModelRate> = {};
  const aliasByProvider: Record<string, Record<string, string>> = {};

  for (const entry of entries) {
    if (entry.aliasTarget) {
      aliasByProvider[entry.provider] ??= {};
      aliasByProvider[entry.provider][entry.id] = entry.aliasTarget;
    }
    if (!entry.rate) continue;
    const rate = toRate(entry.rate);
    if (!rate) continue;
    byProvider[entry.provider] ??= {};
    byProvider[entry.provider][entry.id] = rate;
    // First provider to define a model id wins the global fallback — but only
    // live-source rates populate it. Curated overrides are provider-scoped by
    // design, so they must never leak to a lookup under a different provider.
    if (entry.source !== "override" && !global[entry.id]) {
      global[entry.id] = rate;
    }
  }

  const warned = new Set<string>();

  function priceFor(model: string, opts?: PriceOpts): ModelRate | null {
    const agent = opts?.agent;
    // Prefer an explicit provider (multi-provider agents), else derive from agent.
    const provider =
      opts?.provider ?? (agent ? AGENT_PROVIDERS[agent] : undefined);
    // Resolve a provider-scoped alias (replaces the old agent-keyed MODEL_ALIASES).
    const canonical = (provider && aliasByProvider[provider]?.[model]) ?? model;
    if (provider && byProvider[provider]?.[canonical]) {
      return byProvider[provider][canonical];
    }
    return global[canonical] ?? null;
  }

  function costOf(
    tokens: TokenBreakdown,
    model: string,
    opts?: PriceOpts,
  ): number | null {
    const rate = priceFor(model, opts);
    if (!rate) {
      // No price (e.g. legacy Codex "unknown"): cost is N.A., not $0.
      if (!warned.has(model)) {
        console.warn(`[usage] no pricing for model "${model}" — cost is N.A.`);
        warned.add(model);
      }
      return null;
    }
    const perMillion = (count: number, rate1m: number) =>
      (count / 1_000_000) * rate1m;
    // Reasoning is billed at the output rate; cache rates fall back to input.
    const cacheReadRate = rate.cacheRead || rate.input;
    const cacheWriteRate = rate.cacheWrite || rate.input;
    return (
      perMillion(tokens.input, rate.input) +
      perMillion(tokens.output, rate.output) +
      perMillion(tokens.cacheRead, cacheReadRate) +
      perMillion(tokens.cacheWrite, cacheWriteRate) +
      perMillion(tokens.reasoning, rate.output)
    );
  }

  return { priceFor, costOf };
}

/**
 * Build a {@link Pricing} from a raw models.dev payload. Back-compat wrapper
 * over {@link buildPricingFromRegistry} for callers/fixtures that only have the
 * models.dev API (no LiteLLM/overrides layer).
 */
export function buildPricing(api: ModelsDevApi): Pricing {
  return buildPricingFromRegistry(normaliseModelsDev(api));
}
