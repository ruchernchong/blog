import {
  buildPricingFromRegistry,
  type Pricing,
} from "@workspace/usage/pricing";
import {
  type GatewayApi,
  type ModelEntry,
  type ModelsDevApi,
  mergeRegistry,
  normaliseAIGateway,
  normaliseModelsDev,
  normaliseOpenRouter,
  type OpenRouterApi,
  type RegistrySource,
  SEED_OVERRIDES,
} from "@workspace/usage/registry";
import { and, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import redis from "@/config/redis";
import { logWarning } from "@/lib/logger";
import { rowToEntry, upsertModelRegistry } from "@/lib/queries/model-registry";
import { repriceUnpricedTokenUsage } from "@/lib/queries/usage";
import { db, model } from "@/schema";

const MODELS_API_URL = "https://models.dev/api.json";
/**
 * The Gateway catalogue is public: an unauthenticated GET returns it, while an
 * *invalid* bearer is rejected with 401. So this is deliberately sent with no
 * Authorization header — supplying a stale token could only turn a working
 * request into a failing one, and the public catalogue carries everything the
 * registry needs (list prices plus names, release dates and context windows).
 */
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/models";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/models";
const MODELS_PRICING_CACHE_KEY = "models:pricing";
const GATEWAY_CACHE_KEY = "models:gateway";
const OPENROUTER_CACHE_KEY = "models:openrouter";
const SOURCE_CACHE_TTL = 86_400;

/** Human-readable source names, for log lines and workflow step messages. */
export const SOURCE_LABELS: Record<RegistrySource, string> = {
  gateway: "AI Gateway",
  openrouter: "OpenRouter",
  "models.dev": "models.dev",
};

const PROVIDER_ALIASES: Record<string, string> = {
  ollama: "ollama-cloud",
  "x-ai": "xai",
};

const FALLBACK_PROVIDER_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  cursor: "Cursor",
  "fireworks-ai": "Fireworks AI",
  google: "Google",
  ollama: "Ollama Cloud",
  "ollama-cloud": "Ollama Cloud",
  opencode: "OpenCode Zen",
  "opencode-go": "OpenCode Go",
  openai: "OpenAI",
  xai: "xAI",
  "x-ai": "xAI",
};

interface ModelsProviderMetadata {
  name?: string;
}

type ModelsApi = ModelsDevApi & Record<string, ModelsProviderMetadata>;

async function getModelsApi(): Promise<ModelsApi> {
  "use cache";
  cacheLife("days");
  cacheTag("models:providers");

  return fetchModelsApi();
}

/**
 * Build {@link Pricing} from the persisted `model` registry.
 *
 * The registry is the merged snapshot written by {@link syncModelRegistry} on
 * each ingest, so this is also the last-good fallback when a live source fetch
 * fails. Used by the reprice pass and the prod ingest route.
 */
export async function loadPricing(): Promise<Pricing> {
  const rows = await db.select().from(model);
  return buildPricingFromRegistry(rows.map(rowToEntry));
}

/**
 * Refresh the `model` registry from all sources and return the built pricing.
 *
 * Fetches AI Gateway (zero-markup vendor list rates, plus names and release
 * dates), OpenRouter (a small tail of vendor-internal slugs), and models.dev
 * (the only source covering reseller-routed providers such as OpenCode, which
 * bill at the reseller's rate) alongside the curated DB overrides. Merges by
 * precedence — override > Gateway > models.dev > OpenRouter for rates —
 * upserts the merged rows, and returns pricing built from them. A source that
 * fails to fetch is skipped, not fatal: the merge omits that layer and the
 * existing table rows survive as the last-good snapshot. Runs at the top of
 * each ingest.
 */
export async function syncModelRegistry(): Promise<{
  pricing: Pricing;
  rows: number;
}> {
  const [gateway, openrouter, modelsDev, overrides] = await Promise.all([
    degradeOnFailure(SOURCE_LABELS.gateway, fetchGatewayEntries()),
    degradeOnFailure(SOURCE_LABELS.openrouter, fetchOpenRouterEntries()),
    degradeOnFailure(SOURCE_LABELS["models.dev"], fetchModelsDevEntries()),
    loadOverrideEntries(),
  ]);

  // Seed overrides bootstrap keys the DB has no curated override for yet.
  const seeded = seedOverrides(overrides);

  const merged = mergeRegistry({
    overrides: seeded,
    gateway,
    openrouter,
    modelsDev,
  });
  const rows = await upsertModelRegistry(merged);
  return { pricing: buildPricingFromRegistry(merged), rows };
}

/**
 * Warm one source's Redis cache and report how many entries it yielded.
 *
 * Split out so the sync workflow can fetch each source as an independently
 * retryable step. **Rejects** when the source is unavailable, which is what
 * makes that retry reachable — the caller degrades once retries run out. The
 * entries themselves are deliberately *not* returned: a workflow serialises
 * every step result into its journal, and models.dev alone normalises to ~5,800
 * entries. The subsequent merge step re-reads all three from the Redis cache
 * these calls populate, so only the counts need to cross a step boundary.
 */
export async function refreshRegistrySource(
  source: RegistrySource,
): Promise<number> {
  switch (source) {
    case "gateway":
      return (await fetchGatewayEntries()).length;
    case "openrouter":
      return (await fetchOpenRouterEntries()).length;
    case "models.dev":
      return (await fetchModelsDevEntries()).length;
  }
}

/** Merge in {@link SEED_OVERRIDES} only for keys the DB has no override for. */
function seedOverrides(dbOverrides: ModelEntry[]): ModelEntry[] {
  const have = new Set(dbOverrides.map((e) => `${e.provider} ${e.id}`));
  const missing = SEED_OVERRIDES.filter(
    (e) => !have.has(`${e.provider} ${e.id}`),
  );
  return [...dbOverrides, ...missing];
}

/**
 * Fetch one JSON source through the Redis day-cache and normalise it.
 *
 * **Throws** on failure, deliberately. Degrading is the caller's decision, not
 * this function's, because the two callers want it at different moments: the
 * sync workflow lets the failure reach its step boundary so the step retries,
 * and only degrades once those retries are exhausted, while
 * {@link syncModelRegistry} has no retry machinery behind it and degrades at
 * once through {@link degradeOnFailure}. Swallowing here made the workflow's
 * per-source retry unreachable — the step always succeeded, with an empty
 * layer, on the first transient error.
 */
async function fetchSourceEntries<T>(
  label: string,
  url: string,
  cacheKey: string,
  normalise: (json: T) => ModelEntry[],
): Promise<ModelEntry[]> {
  // The cache read guards itself (see `readCache`): an unreachable or
  // unconfigured Redis must not discard the source when the HTTP fetch below
  // would have succeeded — which is exactly what happened on a local ingest run
  // with no Redis credentials, where every Codex model lost pricing because AI
  // Gateway is its only source.
  const cached = await readCache<T>(cacheKey);
  if (cached) return normalise(cached);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label} returned ${response.status}`);
  }
  const json = (await response.json()) as T;
  try {
    await redis.set(cacheKey, json, { ex: SOURCE_CACHE_TTL });
  } catch {
    // Pricing can still be built from the fresh response if Redis is down.
  }
  return normalise(json);
}

/**
 * Degrade one source to an empty layer. An unavailable source narrows the
 * merge; the other layers plus the persisted table still produce usable
 * pricing, so this must never fail the whole sync.
 */
async function degradeOnFailure(
  label: string,
  entries: Promise<ModelEntry[]>,
): Promise<ModelEntry[]> {
  try {
    return await entries;
  } catch (error) {
    logWarning(`Skipped ${label} source during model registry sync`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function fetchGatewayEntries(): Promise<ModelEntry[]> {
  return fetchSourceEntries<GatewayApi>(
    "AI Gateway",
    GATEWAY_URL,
    GATEWAY_CACHE_KEY,
    normaliseAIGateway,
  );
}

function fetchOpenRouterEntries(): Promise<ModelEntry[]> {
  return fetchSourceEntries<OpenRouterApi>(
    "OpenRouter",
    OPENROUTER_URL,
    OPENROUTER_CACHE_KEY,
    normaliseOpenRouter,
  );
}

/** Throws on failure, for the same reason as {@link fetchSourceEntries}. */
async function fetchModelsDevEntries(): Promise<ModelEntry[]> {
  const cached = await getCachedPricingApi();
  if (cached) return normaliseModelsDev(cached);

  const api = await fetchModelsApi();
  await cachePricingApi(api);
  return normaliseModelsDev(api);
}

async function loadOverrideEntries(): Promise<ModelEntry[]> {
  const rows = await db.select().from(model).where(eq(model.isOverride, true));
  return rows.map(rowToEntry);
}

/**
 * After a curated override changes, heal any `N.A.` (cost-`NULL`) `token_usage`
 * rows against the new pricing and revalidate the `/usage` page. Best-effort:
 * the override row is already persisted, so a failure here just defers pricing
 * to the next `pnpm usage:ingest`. Called by the MCP override tools.
 */
export async function repriceAndRevalidateUsage(): Promise<void> {
  try {
    await repriceUnpricedTokenUsage(await loadPricing());
    revalidateTag("usage", "max");
    revalidateTag("models:providers", "max");
  } catch {
    // Override persisted; the next ingest reprices from stored tokens.
  }
}

export async function getProviderDisplayNames(
  providerIds: string[],
): Promise<Record<string, string>> {
  "use cache";
  cacheLife("days");
  cacheTag("models:providers");

  const providers = [...new Set(providerIds)].sort((a, b) =>
    a.localeCompare(b),
  );
  if (providers.length === 0) {
    return {};
  }

  try {
    const api = await getModelsApi();

    return Object.fromEntries(
      providers.map((providerId) => {
        const modelsProviderId = PROVIDER_ALIASES[providerId] ?? providerId;
        return [
          providerId,
          api[modelsProviderId]?.name ??
            FALLBACK_PROVIDER_NAMES[providerId] ??
            providerId,
        ];
      }),
    );
  } catch {
    return fallbackProviderNames(providers);
  }
}

/**
 * Resolve friendly display names for model ids from the persisted registry.
 * Mirrors {@link getProviderDisplayNames}. Keyed by bare model id to match
 * `UsageBreakdownRow.key` / `summary.favouriteModel`; the first non-null name
 * per id wins. Callers fall back to the raw slug for any id not returned.
 */
export async function getModelDisplayNames(
  modelIds: string[],
): Promise<Record<string, string>> {
  "use cache";
  cacheLife("days");
  cacheTag("models:providers");

  const ids = [...new Set(modelIds)].sort((a, b) => a.localeCompare(b));
  if (ids.length === 0) {
    return {};
  }

  try {
    const rows = await db
      .select({ id: model.id, displayName: model.displayName })
      .from(model)
      .where(inArray(model.id, ids));

    const names: Record<string, string> = {};
    for (const row of rows) {
      // Some models.dev providers echo the slug as the name (302ai lists
      // `claude-opus-4-7`); skip those so a real name from another row wins.
      if (row.displayName === row.id) continue;
      if (row.displayName && !names[row.id]) {
        names[row.id] = row.displayName;
      }
    }
    return names;
  } catch {
    return {};
  }
}

/**
 * Model ids with open weights, per the persisted registry. Keyed by bare id
 * like {@link getModelDisplayNames}; an id counts when any provider's row for
 * it is flagged, since resellers list the same open model under their own slug.
 */
export async function getOpenWeightModelIds(
  modelIds: string[],
): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag("models:providers");

  const ids = [...new Set(modelIds)].sort((a, b) => a.localeCompare(b));
  if (ids.length === 0) {
    return [];
  }

  try {
    const rows = await db
      .selectDistinct({ id: model.id })
      .from(model)
      .where(and(inArray(model.id, ids), eq(model.openWeights, true)));

    return rows.map((row) => row.id).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function fetchModelsApi(): Promise<ModelsApi> {
  const response = await fetch(MODELS_API_URL);
  if (!response.ok) {
    throw new Error(`models.dev returned ${response.status}`);
  }

  return (await response.json()) as ModelsApi;
}

/**
 * Read a cached source payload, treating any Redis failure as a cache miss.
 * The cache is an optimisation, never a dependency: a miss costs one HTTP
 * fetch, whereas an error propagating out of the caller costs the whole source.
 */
async function readCache<T>(cacheKey: string): Promise<T | null> {
  try {
    return await redis.get<T>(cacheKey);
  } catch {
    return null;
  }
}

function getCachedPricingApi(): Promise<ModelsDevApi | null> {
  return readCache<ModelsDevApi>(MODELS_PRICING_CACHE_KEY);
}

async function cachePricingApi(api: ModelsDevApi): Promise<void> {
  try {
    await redis.set(MODELS_PRICING_CACHE_KEY, api, {
      ex: SOURCE_CACHE_TTL,
    });
  } catch {
    // Pricing can still be built from the fresh response if Redis is unavailable.
  }
}

function fallbackProviderNames(providerIds: string[]): Record<string, string> {
  return Object.fromEntries(
    providerIds.map((providerId) => [
      providerId,
      FALLBACK_PROVIDER_NAMES[providerId] ?? providerId,
    ]),
  );
}
