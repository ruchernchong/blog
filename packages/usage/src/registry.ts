import type { ModelRate } from "./pricing";

/**
 * Pure, network-free model-registry layer.
 *
 * Each pricing/metadata source (Vercel AI Gateway, models.dev, OpenRouter, or a
 * curated DB override) is normalised into a common {@link ModelEntry}, then
 * merged by precedence into the rows that back the `model` table and, in turn,
 * pricing.
 *
 * Precedence, applied field-by-field:
 *   - rates:                override > Gateway > OpenRouter > models.dev
 *   - names / metadata:     override > Gateway > models.dev > OpenRouter
 *
 * The layers are complements, not competitors. Gateway is documented zero-markup
 * (vendor list price) and carries names, release dates and cache rates for the
 * first-party vendors. models.dev is the only source covering reseller-routed
 * providers such as OpenCode and Ollama Cloud, which bill at the reseller's rate
 * rather than the vendor's — so it can never be replaced by a vendor source.
 * OpenRouter fills a small tail of vendor-internal slugs neither of the others
 * lists. A curated override always wins. All of this is pure so it can be
 * unit-tested with fixtures — fetching + DB I/O live in `apps/web/src/lib/queries`.
 */

/**
 * The live sources the registry merges, in precedence order.
 *
 * Lives here rather than beside the fetchers so the sync workflow can iterate
 * it: a `"use workflow"` function is compiled into a sandbox with no Node.js
 * access, and that restriction extends to everything its module imports — the
 * fetchers reach Redis and the database, this list reaches nothing.
 */
export const REGISTRY_SOURCES = [
  "gateway",
  "openrouter",
  "models.dev",
] as const;
export type RegistrySource = (typeof REGISTRY_SOURCES)[number];

/** `litellm` is retained for rows written before that source was retired. */
export type ModelSource =
  | "models.dev"
  | "gateway"
  | "openrouter"
  | "litellm"
  | "override";

/**
 * Bootstrap override rows, replacing the former hardcoded `MODEL_RATE_OVERRIDES`
 * / `MODEL_ALIASES`. `syncModelRegistry` merges these as a low-priority override
 * layer only where the DB has no curated override for the key, so local + prod
 * self-seed on first ingest and each row becomes MCP-editable data afterward.
 *
 * These are slugs that appear in no public pricing source, or newly-released
 * frontier models whose live rates we pin until the sources settle (GPT-5.6,
 * Grok 4.6). Rates are USD per 1,000,000 tokens.
 */
export const SEED_OVERRIDES: ModelEntry[] = [
  {
    provider: "anthropic",
    id: "claude-sonnet-5",
    source: "override",
    isOverride: true,
    rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  },
  {
    provider: "openai",
    id: "gpt-5.5-fast",
    source: "override",
    isOverride: true,
    rate: { input: 12.5, output: 75, cacheRead: 1.25, cacheWrite: 0 },
  },
  {
    provider: "openai",
    id: "gpt-5.6",
    source: "override",
    isOverride: true,
    rate: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 },
  },
  {
    provider: "openai",
    id: "gpt-5.6-sol",
    source: "override",
    isOverride: true,
    rate: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 },
  },
  {
    provider: "openai",
    id: "gpt-5.6-terra",
    source: "override",
    isOverride: true,
    rate: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125 },
  },
  {
    provider: "openai",
    id: "gpt-5.6-luna",
    source: "override",
    isOverride: true,
    rate: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25 },
  },
  {
    provider: "openai",
    id: "codex-auto-review",
    source: "override",
    isOverride: true,
    aliasTarget: "gpt-5-codex",
  },
  {
    provider: "xai",
    id: "grok-4.6",
    source: "override",
    isOverride: true,
    displayName: "Grok 4.6",
    rate: { input: 2, output: 6, cacheRead: 0.5, cacheWrite: 0 },
  },
  {
    provider: "xai",
    id: "grok-4.6-fast",
    source: "override",
    isOverride: true,
    displayName: "Grok 4.6 Fast",
    rate: { input: 4, output: 12, cacheRead: 1, cacheWrite: 0 },
  },
];

/** One model's pricing + metadata from a single source (before merging). */
export interface ModelEntry {
  provider: string;
  id: string;
  displayName?: string;
  /** USD per 1,000,000 tokens. Partial: a source may know only some buckets. */
  rate?: Partial<ModelRate>;
  contextLimit?: number;
  /** YYYY-MM-DD. */
  releaseDate?: string;
  source: ModelSource;
  isOverride?: boolean;
  /** When set, price/label resolve from `(provider, aliasTarget)` instead. */
  aliasTarget?: string;
}

// --- models.dev ------------------------------------------------------------

interface ModelsDevCost {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
}
interface ModelsDevLimit {
  context?: number;
  output?: number;
}
interface ModelsDevModel {
  id?: string;
  name?: string;
  release_date?: string;
  limit?: ModelsDevLimit;
  cost?: ModelsDevCost;
}
interface ModelsDevProvider {
  models?: Record<string, ModelsDevModel>;
}
/** models.dev `api.json`: cost is already USD per 1,000,000 tokens. */
export type ModelsDevApi = Record<string, ModelsDevProvider>;

export function normaliseModelsDev(api: ModelsDevApi): ModelEntry[] {
  const entries: ModelEntry[] = [];
  for (const [provider, providerData] of Object.entries(api)) {
    const models = providerData?.models ?? {};
    for (const [modelId, model] of Object.entries(models)) {
      const cost = model.cost;
      entries.push({
        provider,
        id: modelId,
        displayName: model.name,
        rate:
          cost?.input != null && cost.output != null
            ? {
                input: cost.input,
                output: cost.output,
                cacheRead: cost.cache_read ?? 0,
                cacheWrite: cost.cache_write ?? 0,
              }
            : undefined,
        contextLimit: model.limit?.context,
        releaseDate: model.release_date,
        source: "models.dev",
      });
    }
  }
  return entries;
}

// --- Slug canonicalisation --------------------------------------------------

/**
 * Reduce a model slug to a comparison key.
 *
 * Sources disagree on punctuation for the same model. Vercel AI Gateway
 * documents dots for version numbers (`claude-opus-4.8`) while the Anthropic
 * API — and therefore our agent logs — use dashes (`claude-opus-4-8`), and logs
 * additionally carry a dated variant (`claude-haiku-4-5-20251001`). Stripping
 * the date suffix and all punctuation makes those three forms one key.
 *
 * Only ever used as a *fallback* after an exact id match, so a hypothetical
 * collision between two genuinely different slugs cannot displace an exact hit.
 */
export function canonicalSlug(slug: string): string {
  return slug
    .replace(/-\d{8}$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Prices arrive per-token; the registry stores USD/1M.
 *
 * Anything that is not a finite number becomes `undefined` rather than being
 * passed through. `Number("")` is `0` and `Number("n/a")` is `NaN`, and both
 * would otherwise survive the `!= null` checks downstream — Postgres `numeric`
 * accepts `'NaN'`, so a malformed price would persist and silently poison every
 * cost computed from it. A genuine zero (free models) is finite and kept.
 *
 * The parameter is widened to `string | number` and coerced rather than assumed.
 * Gateway and OpenRouter both send decimal *strings* today, but these payloads
 * are `as`-cast straight from `response.json()`, so nothing enforces that at
 * runtime — and number is the more natural JSON encoding for a price (models.dev
 * already uses it). Calling a string method on a number here would throw out of
 * the normaliser and cost the whole source, which is the very failure {@link
 * isoDay} guards against.
 */
const perTokenStr = (v?: string | number): number | undefined => {
  if (v == null || (typeof v === "string" && v.trim() === "")) return undefined;
  const perMillion = Number(v) * 1_000_000;
  return Number.isFinite(perMillion) ? perMillion : undefined;
};

/**
 * Unix seconds → `YYYY-MM-DD`, or `undefined` if the value is not a real date.
 * `toISOString()` throws a RangeError on an out-of-range date, and that throw
 * would escape the normaliser and take the entire source down with it.
 */
const isoDay = (unixSeconds?: number): string | undefined => {
  if (unixSeconds == null) return undefined;
  const date = new Date(unixSeconds * 1000);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 10);
};

// --- Vercel AI Gateway -------------------------------------------------------

/** Decimal strings today; typed loosely because the payload is `as`-cast. */
interface GatewayPricing {
  input?: string | number;
  output?: string | number;
  input_cache_read?: string | number;
  input_cache_write?: string | number;
}
interface GatewayModel {
  id?: string;
  name?: string;
  released?: number;
  context_window?: number;
  pricing?: GatewayPricing;
}
/** `GET https://ai-gateway.vercel.sh/v1/models`. */
export interface GatewayApi {
  data?: GatewayModel[];
}

/**
 * Normalise the AI Gateway catalogue.
 *
 * Ids are uniformly `owner/model`, so the provider needs no inference — a large
 * part of why this replaced the LiteLLM adapter. Vercel documents Gateway as
 * zero-markup ("tokens at exact provider list price"), so these are vendor list
 * rates rather than a reseller's.
 */
export function normaliseAIGateway(api: GatewayApi): ModelEntry[] {
  const entries: ModelEntry[] = [];
  for (const model of api.data ?? []) {
    const slash = model.id?.indexOf("/") ?? -1;
    if (!model.id || slash <= 0) continue;
    const input = perTokenStr(model.pricing?.input);
    const output = perTokenStr(model.pricing?.output);
    entries.push({
      provider: model.id.slice(0, slash),
      id: model.id.slice(slash + 1),
      displayName: model.name,
      rate:
        input != null && output != null
          ? {
              input,
              output,
              cacheRead: perTokenStr(model.pricing?.input_cache_read) ?? 0,
              cacheWrite: perTokenStr(model.pricing?.input_cache_write) ?? 0,
            }
          : undefined,
      contextLimit: model.context_window,
      releaseDate: isoDay(model.released),
      source: "gateway",
    });
  }
  return entries;
}

// --- OpenRouter --------------------------------------------------------------

/** Decimal strings today; typed loosely because the payload is `as`-cast. */
interface OpenRouterPricing {
  prompt?: string | number;
  completion?: string | number;
  input_cache_read?: string | number;
  input_cache_write?: string | number;
}
interface OpenRouterModel {
  id: string;
  name?: string;
  created?: number;
  context_length?: number;
  pricing?: OpenRouterPricing;
}
/** `GET https://openrouter.ai/api/v1/models`. */
export interface OpenRouterApi {
  data?: OpenRouterModel[];
}

/**
 * Normalise the OpenRouter catalogue. Same `vendor/model` id shape as Gateway.
 * Carries a handful of vendor-internal slugs the other sources miss entirely
 * (e.g. the `gpt-5.6-*-pro` variants), which is the reason it is in the merge.
 */
export function normaliseOpenRouter(api: OpenRouterApi): ModelEntry[] {
  const entries: ModelEntry[] = [];
  for (const model of api.data ?? []) {
    const slash = model.id.indexOf("/");
    if (slash <= 0) continue;
    const input = perTokenStr(model.pricing?.prompt);
    const output = perTokenStr(model.pricing?.completion);
    entries.push({
      provider: model.id.slice(0, slash),
      id: model.id.slice(slash + 1),
      displayName: model.name,
      rate:
        input != null && output != null
          ? {
              input,
              output,
              cacheRead: perTokenStr(model.pricing?.input_cache_read) ?? 0,
              cacheWrite: perTokenStr(model.pricing?.input_cache_write) ?? 0,
            }
          : undefined,
      contextLimit: model.context_length,
      releaseDate: isoDay(model.created),
      source: "openrouter",
    });
  }
  return entries;
}

// --- Merge -----------------------------------------------------------------

const keyOf = (e: { provider: string; id: string }) => `${e.provider}\0${e.id}`;

function indexBy(entries: ModelEntry[]): Map<string, ModelEntry> {
  const map = new Map<string, ModelEntry>();
  for (const entry of entries) {
    if (!map.has(keyOf(entry))) map.set(keyOf(entry), entry);
  }
  return map;
}

function hasFullRate(entry?: ModelEntry): boolean {
  return entry?.rate?.input != null && entry?.rate?.output != null;
}

function pick<T>(...values: (T | undefined)[]): T | undefined {
  return values.find((v) => v != null);
}

/**
 * Merge the source layers into one entry per (provider, id). Rates are taken as
 * a unit from the highest-precedence layer that defines input+output (never
 * mixing input from one source with output from another); names/metadata fill
 * independently from the highest layer that has each.
 *
 * In practice the ordering rarely decides anything: across the models actually
 * in use, the sources were measured to disagree on exactly one rate. It matters
 * for *coverage*, not arbitration — each layer mostly fills gaps the others
 * have. models.dev in particular is the only source carrying reseller-routed
 * providers (OpenCode, Ollama Cloud), which bill at the reseller's rate rather
 * than the vendor's, so it can never be dropped in favour of a vendor source.
 */
export function mergeRegistry(sources: {
  overrides: ModelEntry[];
  gateway: ModelEntry[];
  openrouter: ModelEntry[];
  modelsDev: ModelEntry[];
}): ModelEntry[] {
  const override = indexBy(sources.overrides);
  const gateway = indexBy(sources.gateway);
  const openrouter = indexBy(sources.openrouter);
  const modelsDev = indexBy(sources.modelsDev);

  const keys = new Set([
    ...override.keys(),
    ...gateway.keys(),
    ...openrouter.keys(),
    ...modelsDev.keys(),
  ]);

  return [...keys].map((key) => {
    const o = override.get(key);
    const g = gateway.get(key);
    const r = openrouter.get(key);
    const m = modelsDev.get(key);
    const base = (o ?? g ?? r ?? m) as ModelEntry;

    // Rates: override > Gateway > OpenRouter > models.dev, taken whole from the
    // first layer that fully defines them.
    const rateLayer = [o, g, r, m].find((layer) => hasFullRate(layer));

    return {
      provider: base.provider,
      id: base.id,
      // Names/metadata: override > Gateway > models.dev > OpenRouter.
      displayName: pick(
        o?.displayName,
        g?.displayName,
        m?.displayName,
        r?.displayName,
      ),
      rate: rateLayer?.rate,
      contextLimit: pick(
        o?.contextLimit,
        g?.contextLimit,
        m?.contextLimit,
        r?.contextLimit,
      ),
      releaseDate: pick(
        o?.releaseDate,
        g?.releaseDate,
        m?.releaseDate,
        r?.releaseDate,
      ),
      aliasTarget: pick(
        o?.aliasTarget,
        g?.aliasTarget,
        r?.aliasTarget,
        m?.aliasTarget,
      ),
      source: rateLayer?.source ?? o?.source ?? base.source,
      isOverride: o != null,
    } satisfies ModelEntry;
  });
}
