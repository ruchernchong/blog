import { usageIngestSchema } from "@workspace/usage/ingest";
import { revalidateTag } from "next/cache";
import { start } from "workflow/api";
import { ERROR_IDS } from "@/constants/error-ids";
import { handleApiError } from "@/lib/api/errors";
import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { parseAndValidateBody } from "@/lib/api/validation";
import { logWarning } from "@/lib/logger";
import { upsertTokenEffortUsage, upsertTokenUsage } from "@/lib/queries/usage";
import { syncModelRegistryWorkflow } from "@/workflows/sync-model-registry";

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
 *
 * The upsert is the only synchronous work. Refreshing the model registry and
 * repricing previously-unpriceable rows are handed to
 * {@link syncModelRegistryWorkflow}, which runs off the request path with
 * per-source retries and a visible success/failure record — this route used to
 * do all of it inline behind a `logWarning`, which is how a missing table went
 * unnoticed for a week.
 *
 * Optional `effortRows` (AgentUsage) are upserted after token rows when present.
 * Effort lives inside the same `"usage"` cache tag via `getUsageProfile`.
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
    const effortUpserted =
      result.data.effortRows.length > 0
        ? await upsertTokenEffortUsage(result.data.effortRows)
        : 0;

    // Fire-and-forget: `start` returns as soon as the run is enqueued. The
    // upsert above is the durable operation, so a scheduling failure must not
    // turn a successful write into a caller-visible 500.
    let syncRunId: string | null = null;
    try {
      const run = await start(syncModelRegistryWorkflow);
      syncRunId = run.runId;
    } catch (error) {
      logWarning("Could not start the model registry sync workflow", {
        errorId: ERROR_IDS.USAGE_INGEST_FAILED,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Publish the rows just written. The workflow revalidates again once the
    // registry lands, which is what refreshes display names.
    revalidateTag("usage", "max");
    return Response.json({ ok: true, upserted, effortUpserted, syncRunId });
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.USAGE_INGEST_FAILED,
      "ingest usage",
      { rows: result.data.rows.length },
    );
  }
}
