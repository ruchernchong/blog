import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/mcp-auth", () => ({
  validateMcpAuth: vi.fn(),
}));

vi.mock("@/lib/queries/usage", () => ({
  upsertTokenUsage: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { upsertTokenUsage } from "@/lib/queries/usage";
import { POST } from "../route";

const mockValidateMcpAuth = vi.mocked(validateMcpAuth);
const mockUpsertTokenUsage = vi.mocked(upsertTokenUsage);
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
  });

  it("should return 401 when auth fails", async () => {
    mockValidateMcpAuth.mockResolvedValue(null);

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(401);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
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

  it("should upsert and revalidate for static-token auth", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });
    mockUpsertTokenUsage.mockResolvedValue(1);

    const response = await POST(postRequest({ rows: [validRow] }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, upserted: 1 });
    expect(mockUpsertTokenUsage).toHaveBeenCalledWith([validRow]);
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
  });

  it("should return 400 when rows is empty", async () => {
    mockValidateMcpAuth.mockResolvedValue({ type: "token" });

    const response = await POST(postRequest({ rows: [] }));

    expect(response.status).toBe(400);
    expect(mockUpsertTokenUsage).not.toHaveBeenCalled();
  });
});
