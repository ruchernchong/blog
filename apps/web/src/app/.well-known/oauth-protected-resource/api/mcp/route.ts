import { NextResponse } from "next/server";
import { mcpResourceMetadata } from "@/lib/api/oauth-protected-resource";

/**
 * RFC 9728 path-suffixed metadata for `/api/mcp`, whose `resource` covers the
 * server URL as MCP clients require.
 */
export function GET() {
  return NextResponse.json(mcpResourceMetadata);
}
