import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMediaTools } from "./tools/media.tools";
import {
  type RegisterPostToolsOptions,
  registerPostTools,
} from "./tools/posts.tools";

export interface CreateServerOptions {
  posts?: RegisterPostToolsOptions;
  media?: Parameters<typeof registerMediaTools>[1];
}

export function createServer(options: CreateServerOptions = {}): McpServer {
  const server = new McpServer({
    name: "blog",
    version: "1.0.0",
  });

  registerPostTools(server, options.posts);
  registerMediaTools(server, options.media);

  return server;
}
