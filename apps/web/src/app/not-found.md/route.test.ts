import { describe, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({ BASE_URL: "https://ruchern.dev" }));

import { GET } from "./route";

describe("GET /not-found.md", () => {
  it("should keep the 404 status with a Markdown body", async () => {
    const response = GET();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Vary")).toBe("Accept");
  });

  it("should explain the error and link to llms.txt and the sitemap", async () => {
    const body = await GET().text();

    expect(body).toContain("# 404: Page not found");
    expect(body).toContain("(https://ruchern.dev/llms.txt)");
    expect(body).toContain("(https://ruchern.dev/sitemap.xml)");
  });
});
