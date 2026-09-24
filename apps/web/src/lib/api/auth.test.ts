import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { requireAdmin, requireAuth } from "./auth";

const getSession = vi.mocked(auth.api.getSession);

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a 401 when there is no session", async () => {
    getSession.mockResolvedValue(null);

    const result = await requireAuth("upload media");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(401);
      expect(await result.response.json()).toEqual({
        message: "Unauthorized. Please sign in to upload media.",
      });
    }
  });

  it("should return the session when signed in", async () => {
    const session = { user: { id: "user-1", role: null } };
    getSession.mockResolvedValue(session as never);

    const result = await requireAuth("upload media");

    expect(result).toEqual({ success: true, data: session });
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a 401 when there is no session", async () => {
    getSession.mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(401);
  });

  it("should return a 403 when the user is not an admin", async () => {
    getSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    } as never);

    const result = await requireAdmin();

    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(403);
  });

  it("should return the session for an admin", async () => {
    const session = { user: { id: "user-1", role: "admin" } };
    getSession.mockResolvedValue(session as never);

    const result = await requireAdmin();

    expect(result).toEqual({ success: true, data: session });
  });
});
