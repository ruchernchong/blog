import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/schema", () => ({ db: {}, posts: {}, model: {}, tokenUsage: {} }));
vi.mock("@/config/redis", () => ({ default: {} }));
vi.mock("@/lib/services", () => ({ mediaService: {} }));
vi.mock("@/lib/queries/model-registry", () => ({
  entryToRow: vi.fn(),
  keepOpenWeights: "keep-open-weights",
  rowToEntry: vi.fn(),
}));

import { createServer } from "./server";

async function listToolNames(localFiles: boolean): Promise<string[]> {
  const server = createServer({ revalidateTags: vi.fn(), localFiles });
  const client = new Client({ name: "test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  const { tools } = await client.listTools();
  await client.close();
  return tools.map((tool) => tool.name);
}

describe("createServer", () => {
  it("should register upload_from_path when local files are available", async () => {
    const names = await listToolNames(true);

    expect(names).toContain("upload_from_path");
    expect(names).toContain("upload_from_url");
  });

  it("should not register upload_from_path when local files are unavailable", async () => {
    const names = await listToolNames(false);

    expect(names).not.toContain("upload_from_path");
    expect(names).toContain("upload_from_url");
    expect(names).toContain("create_post");
  });
});
