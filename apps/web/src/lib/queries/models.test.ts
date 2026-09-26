import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelEntry } from "@/lib/usage/registry";

// `vi.mock` factories are hoisted above module scope, so the spies they close
// over have to be created with `vi.hoisted`.
const {
  redisGet,
  redisSet,
  upsertModelRegistry,
  selectRows,
  whereRows,
  repriceUnpricedTokenUsage,
  revalidateTag,
} = vi.hoisted(() => ({
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  upsertModelRegistry: vi.fn(),
  // Rows for an unfiltered `select().from(model)` (the full registry).
  selectRows: vi.fn(),
  // Rows for a filtered `select().from(model).where(...)`.
  whereRows: vi.fn(),
  repriceUnpricedTokenUsage: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/config/redis", () => ({
  default: { get: redisGet, set: redisSet },
}));

vi.mock("@/lib/logger", () => ({
  logWarning: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag,
}));

vi.mock("@/lib/queries/usage", () => ({ repriceUnpricedTokenUsage }));

vi.mock("@/schema", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: async () => whereRows(),
        // Awaiting `from()` directly resolves the unfiltered query.
        // biome-ignore lint/suspicious/noThenProperty: mimics a Drizzle query builder
        then: (
          resolve: (rows: unknown) => unknown,
          reject: (error: unknown) => unknown,
        ) => Promise.resolve().then(selectRows).then(resolve, reject),
      }),
    }),
  },
  model: {},
}));

vi.mock("@/lib/queries/model-registry", () => ({
  rowToEntry: (row: unknown) => row,
  upsertModelRegistry,
}));

import {
  getModelDisplayNames,
  getProviderDisplayNames,
  loadPricing,
  refreshRegistrySource,
  repriceAndRevalidateUsage,
  syncModelRegistry,
} from "./models";

const gatewayPayload = {
  data: [
    {
      id: "openai/gpt-5-codex",
      name: "GPT-5-Codex",
      pricing: { input: "0.00000125", output: "0.00001" },
    },
  ],
};

/** The entries handed to the upsert, i.e. what the merge actually produced. */
function upsertedEntries(): ModelEntry[] {
  return upsertModelRegistry.mock.calls[0]?.[0] ?? [];
}

describe("syncModelRegistry source fetching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisSet.mockResolvedValue("OK");
    upsertModelRegistry.mockResolvedValue(0);
    // No curated overrides in the DB; the seed overrides still merge.
    whereRows.mockResolvedValue([]);
  });

  it("should let a curated DB override replace the seed for the same key", async () => {
    redisGet.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    const { SEED_OVERRIDES } = await import("@/lib/usage/registry");
    const seed = SEED_OVERRIDES[0];
    const curated: ModelEntry = { ...seed, displayName: "Curated name" };
    whereRows.mockResolvedValue([curated]);

    await syncModelRegistry();

    const matches = upsertedEntries().filter(
      (e) => e.provider === seed.provider && e.id === seed.id,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].displayName).toBe("Curated name");
  });

  it("should log a non-Error rejection when a source is skipped", async () => {
    const { logWarning } = await import("@/lib/logger");
    redisGet.mockResolvedValue(null);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("socket hang up"));

    await syncModelRegistry();

    expect(logWarning).toHaveBeenCalledWith(
      expect.stringContaining("Skipped"),
      { error: "socket hang up" },
    );
  });

  it("should return the upserted row count alongside the pricing", async () => {
    redisGet.mockResolvedValue(gatewayPayload);
    upsertModelRegistry.mockResolvedValue(7);

    const result = await syncModelRegistry();

    expect(result.rows).toBe(7);
    expect(result.pricing).toBeDefined();
  });

  it("should still reach the source when Redis is unavailable", async () => {
    // Regression: an unconfigured or unreachable Redis used to propagate out of
    // the cache read and discard the entire source, even though the HTTP fetch
    // below would have succeeded. On a local ingest with no Redis credentials
    // that took AI Gateway and OpenRouter out together, and every Codex model
    // lost pricing because Gateway is their only source.
    redisGet.mockRejectedValue(new Error("Redis client was not initialized"));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => gatewayPayload,
    });
    vi.stubGlobal("fetch", fetchMock);

    await syncModelRegistry();

    expect(fetchMock).toHaveBeenCalled();
    const codex = upsertedEntries().find(
      (e) => e.provider === "openai" && e.id === "gpt-5-codex",
    );
    expect(codex?.rate).toMatchObject({ input: 1.25, output: 10 });
  });

  it("should serve from cache without fetching when Redis has a payload", async () => {
    redisGet.mockResolvedValue(gatewayPayload);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await syncModelRegistry();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(upsertedEntries().some((e) => e.id === "gpt-5-codex")).toBe(true);
  });

  it("should narrow the merge, not fail, when a source is down", async () => {
    redisGet.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(syncModelRegistry()).resolves.toBeDefined();
    // Every live source failed, so only the seed overrides survive.
    expect(upsertedEntries().every((e) => e.isOverride)).toBe(true);
  });

  it("should not fail a source when writing the cache back fails", async () => {
    redisGet.mockResolvedValue(null);
    redisSet.mockRejectedValue(new Error("Redis unavailable"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => gatewayPayload,
      }),
    );

    await syncModelRegistry();

    expect(upsertedEntries().some((e) => e.id === "gpt-5-codex")).toBe(true);
  });
});

describe("refreshRegistrySource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisSet.mockResolvedValue("OK");
  });

  it("should reject when the source is unavailable", async () => {
    // The workflow wraps this in a retrying step, and a step only retries when
    // it throws. Swallowing the failure here — as this used to — left the step
    // succeeding with an empty layer on the first transient error, so the retry
    // it was split out for could never fire.
    redisGet.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(refreshRegistrySource("gateway")).rejects.toThrow(
      "AI Gateway returned 503",
    );
  });

  it("should report how many entries the source yielded", async () => {
    redisGet.mockResolvedValue(gatewayPayload);

    await expect(refreshRegistrySource("gateway")).resolves.toBe(1);
  });

  it("should count OpenRouter entries from its prompt/completion pricing", async () => {
    redisGet.mockResolvedValue({
      data: [
        {
          id: "openai/gpt-5.6-pro",
          name: "GPT-5.6 Pro",
          pricing: { prompt: "0.00001", completion: "0.00008" },
        },
        { id: "no-vendor-slug", pricing: {} },
      ],
    });

    await expect(refreshRegistrySource("openrouter")).resolves.toBe(1);
  });

  it("should fetch models.dev and write it back to the cache on a miss", async () => {
    redisGet.mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => modelsDevPayload,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshRegistrySource("models.dev")).resolves.toBe(2);
    expect(fetchMock).toHaveBeenCalledWith("https://models.dev/api.json");
    expect(redisSet).toHaveBeenCalledWith(
      "models:pricing",
      modelsDevPayload,
      expect.objectContaining({ ex: 86_400 }),
    );
  });

  it("should serve models.dev from the cache without fetching", async () => {
    redisGet.mockResolvedValue(modelsDevPayload);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshRegistrySource("models.dev")).resolves.toBe(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should still count models.dev when the cache write fails", async () => {
    redisGet.mockResolvedValue(null);
    redisSet.mockRejectedValue(new Error("Redis unavailable"));
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => modelsDevPayload }),
    );

    await expect(refreshRegistrySource("models.dev")).resolves.toBe(2);
  });

  it("should reject when models.dev is unavailable", async () => {
    redisGet.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(refreshRegistrySource("models.dev")).rejects.toThrow(
      "models.dev returned 500",
    );
  });
});

const modelsDevPayload = {
  anthropic: {
    name: "Anthropic",
    models: {
      "claude-opus-4-7": {
        name: "Claude Opus 4.7",
        cost: { input: 15, output: 75 },
      },
      "claude-haiku-4-5": { name: "Claude Haiku 4.5" },
    },
  },
};

describe("loadPricing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should build pricing from every persisted registry row", async () => {
    selectRows.mockResolvedValue([
      {
        provider: "openai",
        id: "gpt-5-codex",
        rate: { input: 1.25, output: 10 },
        isOverride: false,
      },
    ]);

    const pricing = await loadPricing();

    expect(pricing).toBeDefined();
    expect(selectRows).toHaveBeenCalledTimes(1);
  });
});

describe("repriceAndRevalidateUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectRows.mockResolvedValue([]);
  });

  it("should reprice unpriced usage and revalidate the usage caches", async () => {
    repriceUnpricedTokenUsage.mockResolvedValue({ repriced: 3 });

    await repriceAndRevalidateUsage();

    expect(repriceUnpricedTokenUsage).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith("usage", "max");
    expect(revalidateTag).toHaveBeenCalledWith("models:providers", "max");
  });

  it("should swallow a repricing failure without revalidating", async () => {
    repriceUnpricedTokenUsage.mockRejectedValue(new Error("db down"));

    await expect(repriceAndRevalidateUsage()).resolves.toBeUndefined();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("getProviderDisplayNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an empty map without fetching when given no providers", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getProviderDisplayNames([])).resolves.toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should resolve names from models.dev, aliases, fallbacks, then the raw id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          anthropic: { name: "Anthropic, PBC" },
          xai: { name: "xAI Corp" },
        }),
      }),
    );

    await expect(
      getProviderDisplayNames([
        "anthropic",
        "x-ai",
        "cursor",
        "mystery",
        "anthropic",
      ]),
    ).resolves.toEqual({
      anthropic: "Anthropic, PBC",
      "x-ai": "xAI Corp",
      cursor: "Cursor",
      mystery: "mystery",
    });
  });

  it("should fall back to the built-in names when models.dev is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );

    await expect(
      getProviderDisplayNames(["openai", "unknown-provider"]),
    ).resolves.toEqual({
      openai: "OpenAI",
      "unknown-provider": "unknown-provider",
    });
  });
});

describe("getModelDisplayNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an empty map without querying when given no ids", async () => {
    await expect(getModelDisplayNames([])).resolves.toEqual({});
    expect(whereRows).not.toHaveBeenCalled();
  });

  it("should keep the first non-null display name per model id", async () => {
    whereRows.mockResolvedValue([
      { id: "gpt-5", displayName: null },
      { id: "gpt-5", displayName: "GPT-5" },
      { id: "gpt-5", displayName: "GPT-5 (routed)" },
      { id: "claude-opus-4-7", displayName: "Claude Opus 4.7" },
    ]);

    await expect(
      getModelDisplayNames(["gpt-5", "claude-opus-4-7", "gpt-5"]),
    ).resolves.toEqual({
      "gpt-5": "GPT-5",
      "claude-opus-4-7": "Claude Opus 4.7",
    });
  });

  it("should skip a display name that only echoes the model id", async () => {
    whereRows.mockResolvedValue([
      { id: "claude-opus-4-7", displayName: "claude-opus-4-7" },
      { id: "claude-opus-4-7", displayName: "Claude Opus 4.7" },
    ]);

    await expect(getModelDisplayNames(["claude-opus-4-7"])).resolves.toEqual({
      "claude-opus-4-7": "Claude Opus 4.7",
    });
  });

  it("should return an empty map when the registry query fails", async () => {
    whereRows.mockRejectedValue(new Error("db down"));

    await expect(getModelDisplayNames(["gpt-5"])).resolves.toEqual({});
  });
});
