import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { parseAndValidateBody, validateSchema } from "../validation";

const schema = z.object({ name: z.string() });

describe("parseAndValidateBody", () => {
  it("should return the validated body", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ name: "Ru Chern" }),
    });

    const result = await parseAndValidateBody(request, schema);

    expect(result).toEqual({ success: true, data: { name: "Ru Chern" } });
  });

  it("should return a 400 for invalid JSON", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: "not json",
    });

    const result = await parseAndValidateBody(request, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      expect(await result.response.json()).toEqual({
        message: "Invalid JSON in request body",
      });
    }
  });

  it("should return a 400 listing the invalid fields", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ name: 123 }),
    });

    const result = await parseAndValidateBody(request, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(result.response.status).toBe(400);
      expect(body.message).toBe("Validation failed");
      expect(body.errors[0].field).toBe("name");
    }
  });
});

describe("validateSchema", () => {
  it("should rethrow errors that are not validation errors", () => {
    const throwingSchema = z.string().transform(() => {
      throw new Error("boom");
    });

    expect(() => validateSchema(throwingSchema, "value")).toThrow("boom");
  });
});
