import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import { validateRouteParam } from "../params";

const uuidSchema = z.string().uuid();

describe("validateRouteParam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the parsed parameter when it is valid", async () => {
    const id = crypto.randomUUID();

    const result = await validateRouteParam(
      Promise.resolve({ id }),
      "id",
      uuidSchema,
      "media",
    );

    expect(result).toEqual({ success: true, data: id });
  });

  it("should return a 400 naming the resource when validation fails", async () => {
    const result = await validateRouteParam(
      Promise.resolve({ id: "not-a-uuid" }),
      "id",
      uuidSchema,
      "media",
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      message: "Invalid media ID format",
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it("should log and return a generic 400 when params cannot be resolved", async () => {
    const error = new Error("boom");

    const result = await validateRouteParam(
      Promise.reject(error),
      "id",
      uuidSchema,
      "post",
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      message: "Invalid request parameters",
    });
    expect(logError).toHaveBeenCalledWith(ERROR_IDS.INVALID_PARAMS, error);
  });
});
