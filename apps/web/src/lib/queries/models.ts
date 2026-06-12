import {
  buildPricing,
  type ModelsDevApi,
  type Pricing,
} from "@workspace/usage/pricing";
import { cacheLife, cacheTag } from "next/cache";
import redis from "@/config/redis";

const MODELS_API_URL = "https://models.dev/api.json";
const MODELS_PRICING_CACHE_KEY = "models:pricing";
const MODELS_PRICING_CACHE_TTL = 86_400;

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

/** Fetch live pricing from models.dev via Redis and build a {@link Pricing}. */
export async function loadPricing(): Promise<Pricing> {
  const cached = await getCachedPricingApi();
  if (cached) {
    return buildPricing(cached);
  }

  const api = await fetchModelsApi();
  await cachePricingApi(api);
  return buildPricing(api);
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
      ex: MODELS_PRICING_CACHE_TTL,
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
