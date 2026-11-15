import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/llms", () => ({
  getLlmsContent: vi.fn().mockResolvedValue("# Ru Chern's Portfolio\n"),
}));

import { GET } from "./route";

describe("GET /index.md", () => {
  it("should serve the site overview as Markdown", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(await response.text()).toBe("# Ru Chern's Portfolio\n");
  });

  it("should tell caches the homepage varies by Accept", async () => {
    const response = await GET();

    expect(response.headers.get("Vary")).toBe("Accept");
  });
});
