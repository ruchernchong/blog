import { beforeEach, describe, expect, it, vi } from "vitest";

// `vi.mock` factories are hoisted above module scope, so the spies they close
// over have to be created with `vi.hoisted`.
const {
  getStepMetadata,
  getWritable,
  streamWrite,
  streamClose,
  streamReleaseLock,
  refreshRegistrySource,
  loadPricing,
  syncModelRegistry,
  repriceUnpricedTokenUsage,
  revalidateTag,
  logWarning,
} = vi.hoisted(() => {
  const streamWrite = vi.fn();
  const streamClose = vi.fn();
  const streamReleaseLock = vi.fn();
  return {
    getStepMetadata: vi.fn(),
    streamWrite,
    streamClose,
    streamReleaseLock,
    getWritable: vi.fn(() => ({
      getWriter: () => ({
        write: streamWrite,
        releaseLock: streamReleaseLock,
      }),
      close: streamClose,
    })),
    refreshRegistrySource: vi.fn(),
    loadPricing: vi.fn(),
    syncModelRegistry: vi.fn(),
    repriceUnpricedTokenUsage: vi.fn(),
    revalidateTag: vi.fn(),
    logWarning: vi.fn(),
  };
});

vi.mock("workflow", () => ({ getStepMetadata, getWritable }));

vi.mock("next/cache", () => ({ revalidateTag }));

vi.mock("@/lib/logger", () => ({
  logWarning,
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock("@/lib/queries/usage", () => ({ repriceUnpricedTokenUsage }));

vi.mock("@/lib/queries/models", () => ({
  refreshRegistrySource,
  loadPricing,
  syncModelRegistry,
  SOURCE_LABELS: {
    gateway: "AI Gateway",
    openrouter: "OpenRouter",
    "models.dev": "models.dev",
  },
}));

import {
  mergeAndUpsert,
  publishRegistry,
  refreshSource,
  repriceFromRegistry,
} from "../sync-model-registry.steps";

/** The attempt on which a rethrow would fail the run instead of buying a retry. */
const finalAttempt = (refreshSource.maxRetries ?? 0) + 1;

describe("refreshSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should report the entry count when the source is healthy", async () => {
    getStepMetadata.mockReturnValue({ attempt: 1 });
    refreshRegistrySource.mockResolvedValue(42);

    await expect(refreshSource("gateway")).resolves.toEqual({
      source: "gateway",
      entries: 42,
      degraded: false,
    });
    expect(streamWrite).toHaveBeenCalledWith({
      type: "source",
      source: "gateway",
      entries: 42,
      degraded: false,
      error: null,
    });
    expect(streamReleaseLock).toHaveBeenCalled();
  });

  it("should rethrow while attempts remain, so the step retries", async () => {
    // The whole point of splitting the sources into their own steps. A step
    // only retries when it throws, so absorbing the error on an early attempt
    // would spend the retry budget without ever using it.
    refreshRegistrySource.mockRejectedValue(
      new Error("AI Gateway returned 503"),
    );

    for (let attempt = 1; attempt <= finalAttempt - 1; attempt++) {
      getStepMetadata.mockReturnValue({ attempt });
      await expect(refreshSource("gateway")).rejects.toThrow(
        "AI Gateway returned 503",
      );
    }
    expect(streamWrite).not.toHaveBeenCalled();
  });

  it("should degrade on the final attempt rather than fail the run", async () => {
    // Rethrowing here would reach the orchestrator's `Promise.all` and take the
    // merge, upsert, reprice and publish steps down with it. One dead source
    // has to narrow the merge, not lose the other two.
    getStepMetadata.mockReturnValue({ attempt: finalAttempt });
    refreshRegistrySource.mockRejectedValue(
      new Error("AI Gateway returned 503"),
    );

    await expect(refreshSource("gateway")).resolves.toEqual({
      source: "gateway",
      entries: 0,
      degraded: true,
    });
    expect(streamWrite).toHaveBeenCalledWith({
      type: "source",
      source: "gateway",
      entries: 0,
      degraded: true,
      error: "AI Gateway returned 503",
    });
  });

  it("should keep the retry budget and the degrade boundary in step", () => {
    // These two are only correct relative to each other: degrading a step early
    // wastes retries, degrading it late fails the run. Pinning the property
    // stops one moving without the other.
    expect(refreshSource.maxRetries).toBe(3);
  });
});

describe("refreshSource logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log a non-Error failure once retries are exhausted", async () => {
    getStepMetadata.mockReturnValue({ attempt: finalAttempt });
    refreshRegistrySource.mockRejectedValue("socket hang up");

    await refreshSource("openrouter");

    expect(logWarning).toHaveBeenCalledWith(
      "Skipped OpenRouter after exhausting retries",
      expect.objectContaining({
        error: "socket hang up",
        attempt: finalAttempt,
      }),
    );
    expect(streamWrite).toHaveBeenCalledWith({
      type: "source",
      source: "openrouter",
      entries: 0,
      degraded: true,
      error: "socket hang up",
    });
  });
});

describe("mergeAndUpsert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return only the row count, keeping pricing out of the journal", async () => {
    syncModelRegistry.mockResolvedValue({ pricing: { big: true }, rows: 12 });

    await expect(mergeAndUpsert()).resolves.toEqual({ rows: 12 });
  });
});

describe("repriceFromRegistry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadPricing.mockResolvedValue({});
  });

  it("should reprice against the persisted registry and report the count", async () => {
    repriceUnpricedTokenUsage.mockResolvedValue({ repriced: 5 });

    await expect(repriceFromRegistry()).resolves.toBe(5);
    expect(repriceUnpricedTokenUsage).toHaveBeenCalledWith({});
    expect(streamWrite).toHaveBeenCalledWith({
      type: "reprice",
      repriced: 5,
      degraded: false,
      error: null,
    });
  });

  it("should rethrow while attempts remain, so the step retries", async () => {
    repriceUnpricedTokenUsage.mockRejectedValue(new Error("db down"));

    for (let attempt = 1; attempt <= finalAttempt - 1; attempt++) {
      getStepMetadata.mockReturnValue({ attempt });
      await expect(repriceFromRegistry()).rejects.toThrow("db down");
    }
    expect(streamWrite).not.toHaveBeenCalled();
    expect(logWarning).not.toHaveBeenCalled();
  });

  it("should degrade to zero rather than fail the run on the final attempt", async () => {
    getStepMetadata.mockReturnValue({ attempt: finalAttempt });
    repriceUnpricedTokenUsage.mockRejectedValue(new Error("db down"));

    await expect(repriceFromRegistry()).resolves.toBe(0);
    expect(logWarning).toHaveBeenCalledWith(
      "Skipped repricing during model registry sync",
      expect.objectContaining({ error: "db down", attempt: finalAttempt }),
    );
    expect(streamWrite).toHaveBeenCalledWith({
      type: "reprice",
      repriced: 0,
      degraded: true,
      error: "db down",
    });
  });

  it("should stringify a non-Error repricing failure", async () => {
    getStepMetadata.mockReturnValue({ attempt: finalAttempt });
    loadPricing.mockRejectedValue("registry unreachable");

    await expect(repriceFromRegistry()).resolves.toBe(0);
    expect(logWarning).toHaveBeenCalledWith(
      "Skipped repricing during model registry sync",
      expect.objectContaining({ error: "registry unreachable" }),
    );
  });

  it("should keep the retry budget and the degrade boundary in step", () => {
    expect(repriceFromRegistry.maxRetries).toBe(refreshSource.maxRetries);
  });
});

describe("publishRegistry", () => {
  it("should revalidate both the usage and provider-name caches", async () => {
    vi.clearAllMocks();
    await publishRegistry();

    expect(revalidateTag).toHaveBeenCalledWith("usage", "max");
    expect(revalidateTag).toHaveBeenCalledWith("models:providers", "max");
    expect(streamClose).toHaveBeenCalled();
  });
});
