import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMediaTools } from "./tools/media.tools";
import { registerModelTools } from "./tools/models.tools";
import { registerPostTools } from "./tools/posts.tools";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "blog",
    version: "1.0.0",
  });

  registerPostTools(server);
  registerMediaTools(server);
  registerModelTools(server);

  return server;
}
