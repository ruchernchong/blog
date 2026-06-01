import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { handleMcpHttpRequest } from "@/mcp/http";

export async function POST(request: Request) {
  return handleMcpHttpRequest(request, { authenticate: validateMcpAuth });
}

export async function GET(request: Request) {
  return handleMcpHttpRequest(request, { authenticate: validateMcpAuth });
}

export async function DELETE(request: Request) {
  return handleMcpHttpRequest(request, { authenticate: validateMcpAuth });
}

export async function OPTIONS(request: Request) {
  return handleMcpHttpRequest(request, { authenticate: validateMcpAuth });
}

export async function HEAD(request: Request) {
  return handleMcpHttpRequest(request, { authenticate: validateMcpAuth });
}

export async function PUT(request: Request) {
  return handleMcpHttpRequest(request, { authenticate: validateMcpAuth });
}

export async function PATCH(request: Request) {
  return handleMcpHttpRequest(request, { authenticate: validateMcpAuth });
}
