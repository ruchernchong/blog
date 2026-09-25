import { AGENT_PROVIDERS } from "./providers";
import { canonicalSlug, type ModelEntry } from "./registry";
import type { TokenBreakdown } from "./types";

/**
 * Model pricing, built from the merged {@link ModelEntry} registry (AI Gateway +
 * models.dev + OpenRouter + curated DB overrides). Formerly this module embedded
 * pricing gap-fillers as hardcoded constants; they now live as data in the
 * `model` table (bootstrapped from seed override rows and editable via the MCP
 * tools), so a newly-released model prices automatically once a source lists it.
 *
 * Every lookup is provider-scoped: the provider is given explicitly
 * (multi-provider agents like OpenCode) or derived from the agent (Claude →
 * anthropic, Codex → openai). A model whose provider cannot be resolved is
 * unpriceable rather than borrowing another provider's rate — the same slug is
 * routinely a different price under a different provider. Pricing runs on the
 * server: the `/usage` read path, local ingest, and the reprice pass — never
 * in the browser.
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
  /**
   * The registry id a model is billed as, via the same resolution `priceFor`
   * uses (exact id, provider-scoped alias, then punctuation/date-insensitive
   * slug match). Falls back to the model itself when nothing prices it, so an
   * unknown id stays its own (N.A.) row rather than merging with anything.
   */
  canonicalModel(model: string, opts?: PriceOpts): string;
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

function providerOf(opts?: PriceOpts): string | undefined {
  // Prefer an explicit provider (multi-provider agents), else derive from agent.
  return (
    opts?.provider ?? (opts?.agent ? AGENT_PROVIDERS[opts.agent] : undefined)
  );
}

/**
 * Build a {@link Pricing} from the merged model registry. Pure (no network, no
 * DB) so it can be unit-tested with fixture entries.
 */
export function buildPricingFromRegistry(entries: ModelEntry[]): Pricing {
  // Per-provider lookup, plus per-provider aliases (e.g. codex-auto-review →
  // gpt-5-codex). A parallel index keyed by `canonicalSlug` absorbs the
  // punctuation differences between sources (AI Gateway's `claude-opus-4.8` vs
  // the logs' `claude-opus-4-8`); it is only consulted when the exact id misses.
  const byProvider: Record<string, Record<string, ModelRate>> = Object.create(
    null,
  );
  const byProviderCanonical: Record<
    string,
    Record<string, string>
  > = Object.create(null);
  const aliasByProvider: Record<string, Record<string, string>> = Object.create(
    null,
  );

  for (const entry of entries) {
    if (entry.aliasTarget) {
      aliasByProvider[entry.provider] ??= Object.create(null);
      aliasByProvider[entry.provider][entry.id] = entry.aliasTarget;
    }
    if (!entry.rate) continue;
    const rate = toRate(entry.rate);
    if (!rate) continue;
    byProvider[entry.provider] ??= Object.create(null);
    byProvider[entry.provider][entry.id] = rate;
    byProviderCanonical[entry.provider] ??= Object.create(null);
    // First entry wins, so an exact-id duplicate never displaces an earlier one.
    byProviderCanonical[entry.provider][canonicalSlug(entry.id)] ??= entry.id;
  }

  const warned = new Set<string>();

  /** The registry id `model` resolves to under its provider, or `null`. */
  function resolve(model: string, opts?: PriceOpts): string | null {
    const provider = providerOf(opts);
    if (!provider) return null;
    // Resolve a provider-scoped alias (replaces the old agent-keyed MODEL_ALIASES).
    const target = aliasByProvider[provider]?.[model] ?? model;
    if (byProvider[provider]?.[target]) return target;
    return byProviderCanonical[provider]?.[canonicalSlug(target)] ?? null;
  }

  function canonicalModel(model: string, opts?: PriceOpts): string {
    return resolve(model, opts) ?? model;
  }

  function priceFor(model: string, opts?: PriceOpts): ModelRate | null {
    const provider = providerOf(opts);
    const id = resolve(model, opts);
    if (!provider || id === null) return null;
    return byProvider[provider][id];
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

  return { priceFor, canonicalModel, costOf };
}
