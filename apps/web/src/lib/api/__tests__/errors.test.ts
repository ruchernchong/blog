import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import {
  conflictResponse,
  databaseErrorResponse,
  handleApiError,
  internalErrorResponse,
  isDatabaseError,
  isUniqueConstraintError,
  methodNotAllowedResponse,
  notFoundResponse,
} from "../errors";

describe("error responses", () => {
  it("should return a 503 for database errors", async () => {
    const response = databaseErrorResponse();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      message: "Database connection error. Please try again later.",
    });
  });

  it("should return a 404 naming the resource", async () => {
    const response = notFoundResponse("Post");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Post not found" });
  });

  it("should return a 409 naming the resource and field", async () => {
    const response = conflictResponse("post", "slug");

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      message: "A post with this slug already exists.",
    });
  });

  it("should return a 405 with the Allow header", () => {
    const response = methodNotAllowedResponse("POST, OPTIONS");

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
  });

  it("should return a 500 naming the failed action", async () => {
    const response = internalErrorResponse("fetch media");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Failed to fetch media",
    });
  });
});

describe("error checks", () => {
  it("should detect database errors", () => {
    expect(isDatabaseError(new Error("database is down"))).toBe(true);
    expect(isDatabaseError(new Error("something else"))).toBe(false);
    expect(isDatabaseError("database")).toBe(false);
  });

  it("should detect unique constraint errors", () => {
    expect(
      isUniqueConstraintError(new Error("violates unique constraint")),
    ).toBe(true);
    expect(isUniqueConstraintError(new Error("something else"))).toBe(false);
  });
});

describe("handleApiError", () => {
  it("should log and return a 503 for database errors", () => {
    const error = new Error("database is down");

    const response = handleApiError(error, ERROR_IDS.INVALID_JSON, "fetch");

    expect(logError).toHaveBeenCalledWith(
      ERROR_IDS.INVALID_JSON,
      error,
      undefined,
    );
    expect(response.status).toBe(503);
  });

  it("should return a 500 for other errors", () => {
    const response = handleApiError(
      new Error("boom"),
      ERROR_IDS.INVALID_JSON,
      "fetch",
    );

    expect(response.status).toBe(500);
  });
});
