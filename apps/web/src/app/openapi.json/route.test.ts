import { describe, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({
  BASE_URL: "https://ruchern.dev",
  VERSION: "1.2.3",
}));

import { GET } from "./route";

describe("GET /openapi.json", () => {
  vi.stubEnv("BETTER_AUTH_URL", "https://ruchern.dev");

  it("should serve an OpenAPI 3.1 document as JSON", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");

    const specification = await response.json();
    expect(specification.openapi).toBe("3.1.0");
    expect(specification.info).toMatchObject({
      title: "ruchern.dev API",
      version: "1.2.3",
    });
    expect(specification.servers).toEqual([{ url: "https://ruchern.dev" }]);
  });

  it("should describe every public API route", async () => {
    const { paths } = await GET().json();

    expect(Object.keys(paths)).toEqual([
      "/api/usage/ingest",
      "/api/mcp",
      "/api/mcp/health",
      "/api/revalidate",
      "/.well-known/oauth-authorization-server",
      "/.well-known/oauth-authorization-server/api/auth",
      "/.well-known/oauth-protected-resource",
    ]);
  });

  it("should generate the ingest body from the route's own schema", async () => {
    const { paths } = await GET().json();
    const schema =
      paths["/api/usage/ingest"].post.requestBody.content["application/json"]
        .schema;

    expect(schema.required).toEqual(["rows"]);
    expect(schema.properties.rows.items.required).toContain("totalTokens");
  });

  it("should only reference security schemes and schemas it defines", async () => {
    const specification = await GET().json();
    const text = JSON.stringify(specification);
    const schemes = Object.keys(specification.components.securitySchemes);

    for (const path of Object.values<Record<string, { security: object[] }>>(
      specification.paths,
    )) {
      for (const operation of Object.values(path)) {
        for (const requirement of operation.security) {
          expect(schemes).toEqual(
            expect.arrayContaining(Object.keys(requirement)),
          );
        }
      }
    }
    for (const [, name] of text.matchAll(/#\/components\/schemas\/(\w+)/g)) {
      expect(specification.components.schemas).toHaveProperty(name);
    }
  });
});
