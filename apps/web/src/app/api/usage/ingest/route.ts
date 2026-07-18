import { usageIngestSchema } from "@workspace/usage/ingest";
import { revalidateTag } from "next/cache";
import { ERROR_IDS } from "@/constants/error-ids";
import { handleApiError } from "@/lib/api/errors";
import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { parseAndValidateBody } from "@/lib/api/validation";
import { logWarning } from "@/lib/logger";
import { loadPricing, syncModelRegistry } from "@/lib/queries/models";
import {
  repriceUnpricedTokenUsage,
  upsertTokenUsage,
} from "@/lib/queries/usage";

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
 * After the upsert, every still-`NULL`-cost row is repriced from its stored
 * tokens (healing stale orphans whose source log was pruned, so re-ingesting can
 * no longer reach them), then the `usage` cache tag is revalidated so the public
 * `/usage` page reflects the new data.
 */
export async function POST(request: Request) {
  const auth = await validateMcpAuth(request);
  // Static service token has full trust; any user-bearing auth (session or
  // OAuth) must resolve to an admin. Gating on the resolved user instead of the
  // auth type means new user-auth sources need no change here.
  const allowed = auth?.type === "token" || auth?.user?.role === "admin";

  if (!allowed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await parseAndValidateBody(request, usageIngestSchema);
  if (!result.success) return result.response;

  try {
    const upserted = await upsertTokenUsage(result.data.rows);
    // Heal any stale-NULL orphans (priced models that were unpriceable at their
    // original ingest) straight from stored tokens — independent of local logs.
    // Best-effort: the write above is the primary, durable operation, so a
    // pricing outage (models.dev down → `loadPricing` throws) must not turn a
    // successful upsert into a caller-visible 500 with a stale cache.
    let repriced: Awaited<ReturnType<typeof repriceUnpricedTokenUsage>> | null =
      null;
    try {
      // Refresh the registry from live sources + overrides so prod prices from
      // the same merged snapshot the local ingest does; then reprice.
      await syncModelRegistry();
      repriced = await repriceUnpricedTokenUsage(await loadPricing());
    } catch (error) {
      logWarning("Skipped model sync/repricing during usage ingest", {
        errorId: ERROR_IDS.USAGE_INGEST_FAILED,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    revalidateTag("usage", "max");
    return Response.json({ ok: true, upserted, repriced });
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.USAGE_INGEST_FAILED,
      "ingest usage",
      { rows: result.data.rows.length },
    );
  }
}
