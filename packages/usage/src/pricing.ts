import { AGENT_PROVIDERS } from "./providers";
import type { TokenBreakdown } from "./types";

/**
 * Model pricing, built from the models.dev API payload at ingest time.
 *
 * models.dev exposes one endpoint keyed by provider → models → `cost`
 * (USD per 1M tokens). We resolve each model under its provider first — given
 * explicitly (multi-provider agents like OpenCode) or derived from the agent
 * (Claude → anthropic, Codex → openai) — then fall back to a global lookup.
 * Pricing runs only in the local ingest script, never in the browser.
 */

/**
 * Resolve a known Codex internal model slug that no pricing DB lists (verified
 * against models.dev, LiteLLM, and OpenRouter) to its billed equivalent:
 * `codex-auto-review` is Codex's backend-routed `/review` model
 * (`DEFAULT_APPROVAL_REVIEW_PREFERRED_MODEL` in openai/codex), effectively a
 * GPT-5-family model billed at the gpt-5-codex tier.
 *
 * Applied for cost resolution only — the raw label is still stored and shown in
 * the breakdown, so the data stays faithful to the logs. We deliberately do NOT
 * alias `unknown` (legacy v0.34.0 sessions that recorded no model): we don't
 * fabricate a cost for a model we can't identify, so its cost resolves to null
 * (rendered as "N.A.").
 */
const MODEL_ALIASES: Record<string, Record<string, string>> = {
  codex: { "codex-auto-review": "gpt-5-codex" },
};

/** USD per 1,000,000 tokens for each token kind. */
export interface ModelRate {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

const GPT_5_6_SOL_RATE: ModelRate = {
  input: 5,
  output: 30,
  cacheRead: 0.5,
  cacheWrite: 6.25,
};

/**
 * Provider-scoped rates that must remain stable even when a pricing database is
 * stale or missing a model. Returned ahead of the models.dev lookup so the cost
 * is baked straight into the stored `costUsd`.
 *
 * OpenCode logs OpenAI's fast (priority) service tier as the distinct model id
 * `gpt-5.5-fast`, which pricing databases omit or price incorrectly. GPT-5.6 is
 * pinned to OpenAI's published standard-context rates, including the 90% cache-
 * read discount and cache writes at 1.25x uncached input. The generic `gpt-5.6`
 * id is a Sol alias. Long-context and unpublished fast/pro variants are not
 * inferred from aggregate logs.
 *
 * @see https://openai.com/index/previewing-gpt-5-6-sol/
 */
const MODEL_RATE_OVERRIDES: Record<string, Record<string, ModelRate>> = {
  anthropic: {
    // Standard (from 1 Sep 2026) pricing (docs: platform.claude.com/docs/en/about-claude/pricing).
    // models.dev doesn't list claude-sonnet-5 yet, so this covers it until that catches
    // up. Deliberately NOT the introductory rate ($2/$10) in effect through 31 Aug 2026 —
    // this override always prices Sonnet 5 at the standard rate, same as Sonnet 4.5.
    "claude-sonnet-5": {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
    },
  },
  openai: {
    "gpt-5.5-fast": { input: 12.5, output: 75, cacheRead: 1.25, cacheWrite: 0 },
    "gpt-5.6": GPT_5_6_SOL_RATE,
    "gpt-5.6-sol": GPT_5_6_SOL_RATE,
    "gpt-5.6-terra": {
      input: 2.5,
      output: 15,
      cacheRead: 0.25,
      cacheWrite: 3.125,
    },
    "gpt-5.6-luna": {
      input: 1,
      output: 6,
      cacheRead: 0.1,
      cacheWrite: 1.25,
    },
  },
};

/**
 * How to resolve a model's provider for pricing. Pass `provider` directly for
 * multi-provider agents (OpenCode); `agent` derives it (claude/codex) and also
 * selects {@link MODEL_ALIASES}.
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

interface ModelsDevCost {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
}
interface ModelsDevModel {
  cost?: ModelsDevCost;
}
interface ModelsDevProvider {
  models?: Record<string, ModelsDevModel>;
}
export type ModelsDevApi = Record<string, ModelsDevProvider>;

function toRate(cost: ModelsDevCost): ModelRate {
  return {
    input: cost.input ?? 0,
    output: cost.output ?? 0,
    cacheRead: cost.cache_read ?? 0,
    cacheWrite: cost.cache_write ?? 0,
  };
}

/**
 * Build a {@link Pricing} from a models.dev API payload. Pure (no network) so it
 * can be unit-tested with a fixture.
 */
export function buildPricing(api: ModelsDevApi): Pricing {
  // Per-provider lookup, plus a global fallback keyed by bare model id.
  const byProvider: Record<string, Record<string, ModelRate>> = {};
  const global: Record<string, ModelRate> = {};

  for (const [providerId, provider] of Object.entries(api)) {
    const models = provider.models ?? {};
    const map: Record<string, ModelRate> = {};
    for (const [modelId, model] of Object.entries(models)) {
      const cost = model.cost;
      if (!cost || cost.input == null || cost.output == null) continue;
      const rate = toRate(cost);
      map[modelId] = rate;
      // First provider to define a model id wins the global fallback.
      if (!global[modelId]) global[modelId] = rate;
    }
    byProvider[providerId] = map;
  }

  const warned = new Set<string>();

  function priceFor(model: string, opts?: PriceOpts): ModelRate | null {
    const agent = opts?.agent;
    // Resolve agent-specific aliases (e.g. codex-auto-review → gpt-5-codex).
    const canonical = (agent && MODEL_ALIASES[agent]?.[model]) ?? model;
    // Prefer an explicit provider (multi-provider agents), else derive from agent.
    const provider =
      opts?.provider ?? (agent ? AGENT_PROVIDERS[agent] : undefined);
    // Provider-scoped overrides take precedence over models.dev.
    if (provider && MODEL_RATE_OVERRIDES[provider]?.[canonical]) {
      return MODEL_RATE_OVERRIDES[provider][canonical];
    }
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
