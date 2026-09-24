import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("MCP health route", () => {
  it("should return ok status without requiring auth", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("mcp-blog");
  });
});
