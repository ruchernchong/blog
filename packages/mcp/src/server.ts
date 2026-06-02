import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  type MediaToolServices,
  registerMediaTools,
} from "./tools/media.tools";
import { type PostToolServices, registerPostTools } from "./tools/posts.tools";

export interface CreateServerOptions {
  media?: MediaToolServices;
  posts?: PostToolServices;
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
