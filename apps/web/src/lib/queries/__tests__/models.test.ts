import type { ModelEntry } from "@workspace/usage/registry";
import { beforeEach, describe, expect, it, vi } from "vitest";

// `vi.mock` factories are hoisted above module scope, so the spies they close
// over have to be created with `vi.hoisted`.
const { redisGet, redisSet, upsertModelRegistry } = vi.hoisted(() => ({
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  upsertModelRegistry: vi.fn(),
}));

vi.mock("@/config/redis", () => ({
  default: { get: redisGet, set: redisSet },
}));

vi.mock("@/lib/logger", () => ({
  logWarning: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

// No curated overrides in the DB for these tests; the seed overrides still merge.
vi.mock("@/schema", () => ({
  db: { select: () => ({ from: () => ({ where: async () => [] }) }) },
  model: {},
  // `models.ts` pulls in the reprice helper, which reaches for these tables.
  tokenUsage: {},
  tokenEffortUsage: {},
}));

vi.mock("@/lib/queries/model-registry", () => ({
  rowToEntry: (row: unknown) => row,
  upsertModelRegistry,
}));

import { refreshRegistrySource, syncModelRegistry } from "../models";

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
});
