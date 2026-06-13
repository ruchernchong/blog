import { NextResponse } from "next/server";
import { protectedResourceMetadata } from "@/lib/api/oauth-protected-resource";

/**
 * RFC 9728 protected-resource metadata for the MCP API, letting MCP clients
 * discover the authorization server without hard-coding the `/api/auth`
 * endpoints.
 */
export function GET() {
  return NextResponse.json(protectedResourceMetadata);
}
