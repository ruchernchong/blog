import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { methodNotAllowedResponse, parseAndValidateBody } from "@/lib/api";
import { logError } from "@/lib/logger";

/** Fixed tags written by `cacheTag()` and invalidated after database writes. */
const ALLOWED_TAGS = new Set([
  "posts:list",
  "posts:count",
  "posts:featured",
  "series:list",
  "usage",
  "models:providers",
]);

/** Per-post tag prefixes, each followed by the post slug. */
const ALLOWED_TAG_PREFIXES = ["post:", "mdx:", "related:"];

const revalidateSchema = z.object({
  // Next.js ignores tags longer than 256 characters.
  tags: z.array(z.string().min(1).max(256)).min(1).max(100),
});

function isAllowedTag(tag: string): boolean {
  return (
    ALLOWED_TAGS.has(tag) ||
    ALLOWED_TAG_PREFIXES.some(
      (prefix) => tag.startsWith(prefix) && tag.length > prefix.length,
    )
  );
}

/**
 * Compares the bearer token with `REVALIDATE_SECRET` in constant time. Both
 * sides are hashed first so differing lengths do not short-circuit.
 */
function isAuthorised(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    logError(
      ERROR_IDS.REVALIDATE_SECRET_MISSING,
      "REVALIDATE_SECRET is not set",
    );
    return false;
  }

  const header = request.headers.get("authorization");
  // The auth scheme is case-insensitive (RFC 7235).
  if (header?.slice(0, 7).toLowerCase() !== "bearer ") return false;

  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header.slice(7)), digest(secret));
}

const ALLOW = "POST";

function methodNotAllowed(): Response {
  return methodNotAllowedResponse(ALLOW);
}

/**
 * Invalidates Next.js Cache Components by tag for an external writer (the MCP
 * server) after it changes the database. Only tags the app actually caches
 * are accepted; a request with any other tag revalidates nothing.
 */
export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await parseAndValidateBody(request, revalidateSchema);
  if (!result.success) return result.response;

  const tags = [...new Set(result.data.tags)];
  const rejected = tags.filter((tag) => !isAllowedTag(tag));
  if (rejected.length > 0) {
    return NextResponse.json(
      { message: "Tags not allowed", rejected },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ revalidated: tags });
}

export async function GET() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function HEAD() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}
