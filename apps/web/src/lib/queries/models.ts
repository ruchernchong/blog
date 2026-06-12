import { cacheLife, cacheTag } from "next/cache";

const MODELS_API_URL = "https://models.dev/api.json";

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

interface ModelsProvider {
  name?: string;
}

type ModelsApi = Record<string, ModelsProvider>;

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
    const response = await fetch(MODELS_API_URL);
    if (!response.ok) {
      return fallbackProviderNames(providers);
    }

    const api = (await response.json()) as ModelsApi;

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

function fallbackProviderNames(providerIds: string[]): Record<string, string> {
  return Object.fromEntries(
    providerIds.map((providerId) => [
      providerId,
      FALLBACK_PROVIDER_NAMES[providerId] ?? providerId,
    ]),
  );
}
