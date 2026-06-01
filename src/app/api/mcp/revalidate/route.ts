import { revalidateTag } from "next/cache";

interface RevalidatePayload {
  tags?: unknown;
}

function isValidSecret(request: Request): boolean {
  const expectedSecret = process.env.MCP_REVALIDATE_SECRET;
  const providedSecret = request.headers.get("x-mcp-revalidate-secret");

  return Boolean(
    expectedSecret && providedSecret && providedSecret === expectedSecret,
  );
}

export async function POST(request: Request) {
  if (!process.env.MCP_REVALIDATE_SECRET) {
    return Response.json(
      { error: "MCP revalidation is not configured" },
      { status: 500 },
    );
  }

  if (!isValidSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as RevalidatePayload;
  const tags = Array.isArray(payload.tags)
    ? payload.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  if (tags.length === 0) {
    return Response.json(
      { error: "At least one cache tag is required" },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  return Response.json({ revalidated: tags });
}
