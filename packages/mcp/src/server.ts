import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMediaTools } from "./tools/media.tools";
import { registerModelTools } from "./tools/models.tools";
import { registerPostTools } from "./tools/posts.tools";

/**
 * Host capabilities the tools need but must not import, so this server's
 * import graph stays free of Next.js.
 */
export interface ServerDeps {
  /** Revalidates the given Cache Components tags after a write. */
  revalidateTags(tags: string[]): Promise<void>;
  /** Registers `upload_from_path`, which reads the host's local filesystem. */
  localFiles: boolean;
}

export function createServer(deps: ServerDeps): McpServer {
  const server = new McpServer({
    name: "blog",
    version: "1.0.0",
  });

  registerPostTools(server, deps);
  registerMediaTools(server, deps);
  registerModelTools(server, deps);

  return server;
}
