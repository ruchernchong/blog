import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/redis", () => ({
  default: { set: vi.fn(), eval: vi.fn() },
}));

vi.mock("@/lib/api/mcp-auth", () => ({
  validateMcpAuth: vi.fn(),
}));

vi.mock("@/lib/queries/usage", () => ({
  upsertTokenUsage: vi.fn(),
  upsertTokenEffortUsage: vi.fn(),
}));

vi.mock("@/lib/queries/models", () => ({
  getModelDisplayNames: vi.fn(),
}));

vi.mock("workflow/api", () => ({
  start: vi.fn(),
}));

vi.mock("@/workflows/sync-model-registry", () => ({
  syncModelRegistryWorkflow: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { start } from "workflow/api";
import redis from "@/config/redis";
import { type McpAuthResult, validateMcpAuth } from "@/lib/api/mcp-auth";
import { getModelDisplayNames } from "@/lib/queries/models";
import { upsertTokenEffortUsage, upsertTokenUsage } from "@/lib/queries/usage";
import { POST } from "./route";

const mockValidateMcpAuth = vi.mocked(validateMcpAuth);
const mockUpsertTokenUsage = vi.mocked(upsertTokenUsage);
const mockUpsertTokenEffortUsage = vi.mocked(upsertTokenEffortUsage);
const mockStart = vi.mocked(start);
const mockGetModelDisplayNames = vi.mocked(getModelDisplayNames);
const mockRevalidateTag = vi.mocked(revalidateTag);
const mockSet = vi.mocked(redis.set);
const mockEval = vi.mocked(redis.eval);

/** A single valid daily aggregate matching the wire contract. */
const validRow = {
  date: "2026-05-30",
  agent: "claude",
  provider: "anthropic",
  model: "claude-opus-4-8",
  inputTokens: 100,
  outputTokens: 200,
  cacheReadTokens: 300,
  cacheWriteTokens: 50,
  reasoningTokens: 0,
  totalTokens: 650,
  costUsd: "1.234560",
  messages: 5,
};

/** The only accepted auth: an OAuth access token owned by an admin. */
const adminOAuth: McpAuthResult = {
  type: "oauth",
  user: {
    id: "admin",
    email: "admin@example.com",
    name: "Admin",
    role: "admin",
  },
  authInfo: {
    token: "oauth-token",
    clientId: "client-1",
    scopes: ["openid", "offline_access"],
  },
};

const validEffortRow = {
  date: "2026-06-02",
  agent: "claude",
  levels: [{ level: "high", sessionCount: 2 }],
  classifiedSessionCount: 2,
  unclassifiedSessionCount: 1,
};

function postRequest(body: unknown) {
  return new Request("http://localhost/api/usage/ingest", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer token",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/usage/ingest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const gates = new Map<string, { token: unknown; expires: number }>();
    mockSet.mockImplementation(async (key, token, options) => {
      if (
        options &&
        "nx" in options &&
        options.nx &&
        (gates.get(key)?.expires ?? 0) > Date.now()
      ) {
        return null;
      }
      const seconds = options && "ex" in options ? (options.ex ?? 0) : 0;
      gates.set(key, { token, expires: Date.now() + seconds * 1000 });
      return "OK";
    });
    mockEval.mockImplementation(async (_script, keys, args) => {
      const key = String(keys[0]);
      if (gates.get(key)?.token !== args[0]) return 0;
      gates.delete(key);
      return 1;
    });
    mockUpsertTokenUsage.mockResolvedValue(1);
    mockUpsertTokenEffortUsage.mockResolvedValue(1);
    // No names by default, so every ingest is eligible to start the sync.
    mockGetModelDisplayNames.mockResolvedValue({});
    mockStart.mockResolvedValue({ runId: "run_123" } as Awaited<
      ReturnType<typeof start>
    >);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("should not start the sync when every model has a display name", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    mockGetModelDisplayNames.mockResolvedValue({
      "claude-opus-4-8": "Claude Opus 4.8",
    });

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(await response.json()).toMatchObject({ ok: true, syncRunId: null });
    expect(mockGetModelDisplayNames).toHaveBeenCalledWith(["claude-opus-4-8"]);
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith("usage", "max");
  });

  it("should start the sync when any model has no display name", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    mockGetModelDisplayNames.mockResolvedValue({
      "claude-opus-4-8": "Claude Opus 4.8",
    });

    const response = await POST(
      postRequest({ rows: [validRow, { ...validRow, model: "gpt-9" }] }),
    );

    expect(await response.json()).toMatchObject({ syncRunId: "run_123" });
    expect(mockStart).toHaveBeenCalledOnce();
  });

  it("should ingest every batch but start only one sync within 24 hours", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    const clock = vi.spyOn(Date, "now").mockReturnValue(0);

    await POST(postRequest({ rows: [validRow] }));
    clock.mockReturnValue(24 * 60 * 60 * 1000 - 1);
    const skipped = await POST(postRequest({ rows: [validRow] }));

    expect(await skipped.json()).toMatchObject({ ok: true, syncRunId: null });
    expect(mockUpsertTokenUsage).toHaveBeenCalledTimes(2);
    expect(mockStart).toHaveBeenCalledOnce();

    clock.mockReturnValue(24 * 60 * 60 * 1000);
    const nextDay = await POST(postRequest({ rows: [validRow] }));

    expect(await nextDay.json()).toMatchObject({ syncRunId: "run_123" });
    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  it("should start only one sync for concurrent ingests", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => POST(postRequest({ rows: [validRow] }))),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(mockUpsertTokenUsage).toHaveBeenCalledTimes(5);
    expect(mockStart).toHaveBeenCalledOnce();
  });

  it("should let the next ingest retry when enqueueing fails", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    mockStart.mockRejectedValueOnce(new Error("queue unavailable"));

    const failed = await POST(postRequest({ rows: [validRow] }));
    const retried = await POST(postRequest({ rows: [validRow] }));

    expect(await failed.json()).toMatchObject({ ok: true, syncRunId: null });
    expect(await retried.json()).toMatchObject({ syncRunId: "run_123" });
    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  it("should keep ingesting without starting unthrottled syncs when Redis is down", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    mockSet.mockRejectedValueOnce(new Error("Redis unavailable"));

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(await response.json()).toMatchObject({ ok: true, syncRunId: null });
    expect(mockStart).not.toHaveBeenCalled();
    expect(mockEval).not.toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith("usage", "max");
  });

  it("should keep ingesting when releasing a failed scheduling claim fails", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    mockStart.mockRejectedValueOnce(new Error("queue unavailable"));
    mockEval.mockRejectedValueOnce(new Error("Redis unavailable"));

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(await response.json()).toMatchObject({ ok: true, syncRunId: null });
    expect(mockEval).toHaveBeenCalledOnce();
  });

  it("should keep production and preview sync windows separate", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    vi.stubEnv("VERCEL_ENV", "production");
    await POST(postRequest({ rows: [validRow] }));
    vi.stubEnv("VERCEL_ENV", "preview");
    await POST(postRequest({ rows: [validRow] }));

    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  it("should return 401 when auth fails", async () => {
    mockValidateMcpAuth.mockResolvedValue(null);

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(401);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("should upsert, start the sync workflow, and revalidate", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      upserted: 1,
      effortUpserted: 0,
      syncRunId: "run_123",
    });
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([
      { ...validRow, session: null, device: null },
    ]);
    expect(mockUpsertTokenEffortUsage).not.toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockRevalidateTag).toHaveBeenCalledWith("usage", "max");
  });

  it("should keep the session each row sends", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const response = await POST(
      postRequest({
        device: "mac-mini",
        rows: [{ ...validRow, session: "0123456789abcdef" }],
      }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([
      { ...validRow, session: "0123456789abcdef", device: "mac-mini" },
    ]);
  });

  it("should file every row under the device the client sends", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const response = await POST(
      postRequest({ device: "mac-mini", rows: [validRow] }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([
      { ...validRow, session: null, device: "mac-mini" },
    ]);
  });

  it("should not block the response on registry work", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    await POST(postRequest({ rows: [validRow] }));

    // Refreshing the registry and repricing now belong to the workflow; the
    // route's only synchronous responsibility is the upsert.
    expect(mockUpsertTokenUsage).toHaveBeenCalledOnce();
    expect(mockStart).toHaveBeenCalledOnce();
  });

  it("should still succeed when the workflow cannot be started", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    // The upsert is the durable operation — a scheduling failure must not turn
    // a successful write into a caller-visible error.
    mockStart.mockRejectedValue(new Error("queue unavailable"));

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      upserted: 1,
      effortUpserted: 0,
      syncRunId: null,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith("usage", "max");
  });

  it("should return 401 for a non-admin OAuth token", async () => {
    mockValidateMcpAuth.mockResolvedValue({
      ...adminOAuth,
      user: { ...adminOAuth.user, role: "user" },
    });

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(401);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
  });

  it("should return 400 when a row is malformed", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const response = await POST(
      postRequest({ rows: [{ ...validRow, inputTokens: -1 }] }),
    );

    expect(response.status).toBe(400);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("should return 400 when rows is empty", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const response = await POST(postRequest({ rows: [] }));

    expect(response.status).toBe(400);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
  });

  it("should skip effort upsert when effortRows is omitted", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([
      { ...validRow, session: null, device: null },
    ]);
    expect(mockUpsertTokenEffortUsage).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ effortUpserted: 0 });
  });

  it("should skip effort upsert when effortRows is empty", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const response = await POST(
      postRequest({ rows: [validRow], effortRows: [] }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([
      { ...validRow, session: null, device: null },
    ]);
    expect(mockUpsertTokenEffortUsage).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ effortUpserted: 0 });
  });

  it("should upsert effort rows when provided", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);
    mockUpsertTokenEffortUsage.mockResolvedValue(1);

    const response = await POST(
      postRequest({
        rows: [validRow],
        effortRows: [validEffortRow],
        effortSnapshotComplete: true,
      }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([
      { ...validRow, session: null, device: null },
    ]);
    expect(mockUpsertTokenEffortUsage).toHaveBeenCalledWith([validEffortRow]);
    expect(await response.json()).toEqual({
      ok: true,
      upserted: 1,
      effortUpserted: 1,
      syncRunId: "run_123",
    });
  });

  it("should return 400 when effort rows are malformed", async () => {
    mockValidateMcpAuth.mockResolvedValue(adminOAuth);

    const response = await POST(
      postRequest({
        rows: [validRow],
        effortRows: [
          {
            ...validEffortRow,
            levels: [{ level: "high", sessionCount: -1 }],
          },
        ],
      }),
    );

    expect(response.status).toBe(400);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
    expect(mockUpsertTokenEffortUsage).not.toHaveBeenCalled();
  });
});
