import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { revalidateTags } from "./revalidate-tags";
import { createServer } from "./server";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDirectory, "../../../apps/web/.env") });

async function main() {
  const server = createServer({ revalidateTags, localFiles: true });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

try {
  await main();
} catch (error) {
  console.error(error);
}
