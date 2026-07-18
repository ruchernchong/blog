import {
  buildPricingFromRegistry,
  type Pricing,
} from "@workspace/usage/pricing";
import {
  type ModelEntry,
  type ModelsDevApi,
  mergeRegistry,
  normaliseLiteLLM,
  normaliseModelsDev,
  SEED_OVERRIDES,
} from "@workspace/usage/registry";
import { eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import redis from "@/config/redis";
import { logWarning } from "@/lib/logger";
import { rowToEntry, upsertModelRegistry } from "@/lib/queries/model-registry";
import { repriceUnpricedTokenUsage } from "@/lib/queries/usage";
import { db, model } from "@/schema";

const MODELS_API_URL = "https://models.dev/api.json";
const LITELLM_URL =
  "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
// OpenRouter is a pluggable alternative secondary source (see
// `normaliseOpenRouter` in @workspace/usage/registry); not wired in by default.
const MODELS_PRICING_CACHE_KEY = "models:pricing";
const LITELLM_CACHE_KEY = "models:litellm";
const SOURCE_CACHE_TTL = 86_400;

const PROVIDER_ALIASES: Record<string, string> = {
  ollama: "ollama-cloud",
};

const FALLBACK_PROVIDER_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  "fireworks-ai": "Fireworks AI",
  google: "Google",
  ollama: "Ollama Cloud",
  "ollama-cloud": "Ollama Cloud",
  opencode: "OpenCode Zen",
  "opencode-go": "OpenCode Go",
  openai: "OpenAI",
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
 * Fetches LiteLLM (primary rates) and models.dev (names/metadata + rate
 * gap-fill) alongside the curated DB overrides, merges them by precedence
 * (override > LiteLLM > models.dev for rates; override > models.dev for names),
 * upserts the merged rows, and returns pricing built from them. A source that
 * fails to fetch is skipped, not fatal — the merge omits that layer and the
 * existing table rows survive as the last-good snapshot. Runs at the top of
 * each ingest.
 */
export async function syncModelRegistry(): Promise<Pricing> {
  const [litellm, modelsDev, overrides] = await Promise.all([
    fetchLiteLLMEntries(),
    fetchModelsDevEntries(),
    loadOverrideEntries(),
  ]);

  // Seed overrides bootstrap keys the DB has no curated override for yet.
  const seeded = seedOverrides(overrides);

  const merged = mergeRegistry({ overrides: seeded, litellm, modelsDev });
  await upsertModelRegistry(merged);
  return buildPricingFromRegistry(merged);
}

/** Merge in {@link SEED_OVERRIDES} only for keys the DB has no override for. */
function seedOverrides(dbOverrides: ModelEntry[]): ModelEntry[] {
  const have = new Set(dbOverrides.map((e) => `${e.provider} ${e.id}`));
  const missing = SEED_OVERRIDES.filter(
    (e) => !have.has(`${e.provider} ${e.id}`),
  );
  return [...dbOverrides, ...missing];
}

async function fetchLiteLLMEntries(): Promise<ModelEntry[]> {
  try {
    const cached = await redis.get<Record<string, unknown>>(LITELLM_CACHE_KEY);
    if (cached) return normaliseLiteLLM(cached);

    const response = await fetch(LITELLM_URL);
    if (!response.ok) throw new Error(`LiteLLM returned ${response.status}`);
    const json = (await response.json()) as Record<string, unknown>;
    try {
      await redis.set(LITELLM_CACHE_KEY, json, { ex: SOURCE_CACHE_TTL });
    } catch {
      // Pricing can still be built from the fresh response if Redis is down.
    }
    return normaliseLiteLLM(json);
  } catch (error) {
    logWarning("Skipped LiteLLM source during model registry sync", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function fetchModelsDevEntries(): Promise<ModelEntry[]> {
  try {
    const cached = await getCachedPricingApi();
    if (cached) return normaliseModelsDev(cached);

    const api = await fetchModelsApi();
    await cachePricingApi(api);
    return normaliseModelsDev(api);
  } catch (error) {
    logWarning("Skipped models.dev source during model registry sync", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
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

  const providers = [...new Set(providerIds)].sort();
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

  const ids = [...new Set(modelIds)].sort();
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
      if (row.displayName && !names[row.id]) {
        names[row.id] = row.displayName;
      }
    }
    return names;
  } catch {
    return {};
  }
}

async function fetchModelsApi(): Promise<ModelsApi> {
  const response = await fetch(MODELS_API_URL);
  if (!response.ok) {
    throw new Error(`models.dev returned ${response.status}`);
  }

  return (await response.json()) as ModelsApi;
}

async function getCachedPricingApi(): Promise<ModelsDevApi | null> {
  try {
    return await redis.get<ModelsDevApi>(MODELS_PRICING_CACHE_KEY);
  } catch {
    return null;
  }
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
