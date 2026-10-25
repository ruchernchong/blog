import { randomUUID } from "node:crypto";
import { usageIngestSchema } from "@workspace/usage/ingest";
import { revalidateTag } from "next/cache";
import { start } from "workflow/api";
import redis from "@/config/redis";
import { ERROR_IDS } from "@/constants/error-ids";
import { handleApiError } from "@/lib/api/errors";
import { validateMcpAuth } from "@/lib/api/mcp-auth";
import { parseAndValidateBody } from "@/lib/api/validation";
import { logWarning } from "@/lib/logger";
import { getModelDisplayNames } from "@/lib/queries/models";
import { upsertTokenEffortUsage, upsertTokenUsage } from "@/lib/queries/usage";
import { syncModelRegistryWorkflow } from "@/workflows/sync-model-registry";

const REGISTRY_SYNC_INTERVAL_SECONDS = 86_400;

/**
 * True when any ingested model id has no display name in the registry, which
 * is the only reason to refresh it. A lookup failure resolves to no names, so
 * it errs towards syncing; the daily claim below still bounds that.
 */
async function hasUnmappedModels(modelIds: string[]): Promise<boolean> {
  const names = await getModelDisplayNames(modelIds);
  return modelIds.some((id) => !names[id]);
}

/** Claim before enqueueing so batches, devices and server instances share one window. */
async function scheduleRegistrySync(): Promise<string | null> {
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  const key = `models:registry-sync:${environment}`;
  const token = randomUUID();
  let claimed = false;

  try {
    claimed =
      (await redis.set(key, token, {
        nx: true,
        ex: REGISTRY_SYNC_INTERVAL_SECONDS,
      })) === "OK";
    if (!claimed) return null;

    const run = await start(syncModelRegistryWorkflow);
    return run.runId;
  } catch (error) {
    // Redis failure skips scheduling rather than starting an unthrottled run.
    // Usage has already been persisted, so neither failure should fail ingest.
    logWarning("Could not schedule the model registry sync workflow", {
      errorId: ERROR_IDS.USAGE_INGEST_FAILED,
      error: error instanceof Error ? error.message : String(error),
    });
    if (claimed) {
      try {
        // Only release our claim: an expired window may already have a new owner.
        await redis.eval(
          `if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0`,
          [key],
          [token],
        );
      } catch (releaseError) {
        logWarning("Could not release the model registry sync claim", {
          errorId: ERROR_IDS.USAGE_INGEST_FAILED,
          error:
            releaseError instanceof Error
              ? releaseError.message
              : String(releaseError),
        });
      }
    }
    return null;
  }
}

/**
 * Ingest daily token-usage aggregates into *this* deployment's database.
 *
 * The Rust collector (`pnpm usage:ingest`) parses local agent logs (which only
 * exist on the machine that ran the agents), folds them into daily rows, then
 * POSTs them here. Because the write happens server-side, production data is
 * ingested using the deployment's own `DATABASE_URL` — the prod connection
 * string never has to touch the local machine.
 *
 * Writes are gated to an OAuth access token owned by an admin (OAuth sign-up is
 * open, so a plain authenticated user is not enough to overwrite prod data).
 *
 * The upsert is the only synchronous work. Refreshing the model registry and
 * repricing previously-unpriceable rows are handed to
 * {@link syncModelRegistryWorkflow}, which runs off the request path only when
 * an ingested model id has no display name in the registry, and then at most
 * once per 24 hours, with per-source retries and a visible success/failure
 * record. This route used to do all of it inline behind a `logWarning`, which
 * is how a missing table went unnoticed for a week.
 *
 * Optional `effortRows` (AgentUsage) are upserted after token rows when present.
 * Effort lives inside the same `"usage"` cache tag via `getUsageProfile`.
 */
export async function POST(request: Request) {
  const auth = await validateMcpAuth(request);
  const allowed = auth?.user.role === "admin";

  if (!allowed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await parseAndValidateBody(request, usageIngestSchema);
  if (!result.success) return result.response;

  try {
    const { device } = result.data;
    const upserted = await upsertTokenUsage(
      result.data.rows.map((row) => ({ ...row, device })),
    );
    const effortUpserted =
      result.data.effortRows.length > 0
        ? await upsertTokenEffortUsage(result.data.effortRows)
        : 0;

    // Fire-and-forget: `start` returns as soon as the run is enqueued. The
    // upsert above is the durable operation, so a scheduling failure must not
    // turn a successful write into a caller-visible 500.
    const syncRunId = (await hasUnmappedModels(
      result.data.rows.map((row) => row.model),
    ))
      ? await scheduleRegistrySync()
      : null;

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
