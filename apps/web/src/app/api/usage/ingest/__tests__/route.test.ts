import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/mcp-auth", () => ({
  validateMcpAuth: vi.fn(),
}));

vi.mock("@/lib/queries/usage", () => ({
  upsertTokenUsage: vi.fn(),
  upsertTokenEffortUsage: vi.fn(),
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
import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { upsertTokenEffortUsage, upsertTokenUsage } from "@/lib/queries/usage";
import { POST } from "../route";

const mockValidateMcpAuth = vi.mocked(validateMcpAuth);
const mockUpsertTokenUsage = vi.mocked(upsertTokenUsage);
const mockUpsertTokenEffortUsage = vi.mocked(upsertTokenEffortUsage);
const mockStart = vi.mocked(start);
const mockRevalidateTag = vi.mocked(revalidateTag);

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
    mockUpsertTokenUsage.mockResolvedValue(1);
    mockUpsertTokenEffortUsage.mockResolvedValue(1);
    mockStart.mockResolvedValue({ runId: "run_123" } as Awaited<
      ReturnType<typeof start>
    >);
  });

  it("should return 401 when auth fails", async () => {
    mockValidateMcpAuth.mockResolvedValue(null);

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(401);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("should return 401 for a non-admin session", async () => {
    mockValidateMcpAuth.mockResolvedValue({
      type: "session",
      user: {
        id: "u1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    });

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(401);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
  });

  it("should upsert, start the sync workflow, and revalidate", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      upserted: 1,
      effortUpserted: 0,
      syncRunId: "run_123",
    });
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([validRow]);
    expect(mockUpsertTokenEffortUsage).not.toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockRevalidateTag).toHaveBeenCalledWith("usage", "max");
  });

  it("should not block the response on registry work", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });

    await POST(postRequest({ rows: [validRow] }));

    // Refreshing the registry and repricing now belong to the workflow; the
    // route's only synchronous responsibility is the upsert.
    expect(mockUpsertTokenUsage).toHaveBeenCalledOnce();
    expect(mockStart).toHaveBeenCalledOnce();
  });

  it("should still succeed when the workflow cannot be started", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });
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

  it("should upsert for an admin session", async () => {
    mockValidateMcpAuth.mockResolvedValue({
      type: "session",
      user: {
        id: "admin",
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      },
    });

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([validRow]);
  });

  it("should return 400 when a row is malformed", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });

    const response = await POST(
      postRequest({ rows: [{ ...validRow, inputTokens: -1 }] }),
    );

    expect(response.status).toBe(400);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("should return 400 when rows is empty", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });

    const response = await POST(postRequest({ rows: [] }));

    expect(response.status).toBe(400);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
  });

  it("should skip effort upsert when effortRows is omitted", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([validRow]);
    expect(mockUpsertTokenEffortUsage).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ effortUpserted: 0 });
  });

  it("should skip effort upsert when effortRows is empty", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });

    const response = await POST(
      postRequest({ rows: [validRow], effortRows: [] }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([validRow]);
    expect(mockUpsertTokenEffortUsage).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ effortUpserted: 0 });
  });

  it("should upsert effort rows when provided", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });
    mockUpsertTokenEffortUsage.mockResolvedValue(1);

    const response = await POST(
      postRequest({
        rows: [validRow],
        effortRows: [validEffortRow],
        effortSnapshotComplete: true,
      }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([validRow]);
    expect(mockUpsertTokenEffortUsage).toHaveBeenCalledWith([validEffortRow]);
    expect(await response.json()).toEqual({
      ok: true,
      upserted: 1,
      effortUpserted: 1,
      syncRunId: "run_123",
    });
  });

  it("should return 400 when effort rows are malformed", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });

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
