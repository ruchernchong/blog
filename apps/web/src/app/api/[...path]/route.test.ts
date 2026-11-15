import { describe, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({ BASE_URL: "https://ruchern.dev" }));

import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from "./route";

describe("unmatched /api routes", () => {
  it("should return a JSON 404 with a code, message and hint", async () => {
    const response = GET(new Request("https://ruchern.dev/api/nope/deeper"));

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toEqual({
      error: "not_found",
      message: "No API route matches GET /api/nope/deeper",
      hint: "The available endpoints are listed in the OpenAPI specification at https://ruchern.dev/openapi.json",
    });
  });

  it.each([
    ["POST", POST],
    ["PUT", PUT],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
    ["HEAD", HEAD],
    ["OPTIONS", OPTIONS],
  ])("should answer %s the same way", async (method, handler) => {
    const response = handler(
      new Request("https://ruchern.dev/api/nope", { method }),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).message).toBe(
      `No API route matches ${method} /api/nope`,
    );
  });
});
