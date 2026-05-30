import { revalidateTag } from "next/cache";
import { ERROR_IDS } from "@/constants/error-ids";
import { handleApiError, parseAndValidateBody } from "@/lib/api";
import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { upsertTokenUsage } from "@/lib/queries/usage";
import { usageIngestSchema } from "@/lib/usage/ingest";

/**
 * Ingest daily token-usage aggregates into *this* deployment's database.
 *
 * The `usage:ingest` script parses local agent logs (which only exist on the
 * machine that ran the agents), prices and folds them into daily rows, then
 * POSTs them here. Because the write happens server-side, production data is
 * ingested using the deployment's own `DATABASE_URL` — the prod connection
 * string never has to touch the local machine.
 *
 * Writes are gated to the static MCP token or an admin session (OAuth sign-up is
 * open, so a plain authenticated session is not enough to overwrite prod data).
 * After a successful upsert the `usage` cache tag is revalidated so the public
 * `/usage` page reflects the new data.
 */
export async function POST(request: Request) {
  const auth = await validateMcpAuth(request);
  const allowed =
    auth?.type === "token" ||
    (auth?.type === "session" && auth.user?.role === "admin");

  if (!allowed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await parseAndValidateBody(request, usageIngestSchema);
  if (!result.success) return result.response;

  try {
    const upserted = await upsertTokenUsage(result.data.rows);
    revalidateTag("usage", "max");
    return Response.json({ ok: true, upserted });
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.USAGE_INGEST_FAILED,
      "ingest usage",
      { rows: result.data.rows.length },
    );
  }
}
