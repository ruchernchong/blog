import { revalidateTag } from "next/cache";
import { getStepMetadata, getWritable } from "workflow";
import { ERROR_IDS } from "@/constants/error-ids";
import { logWarning } from "@/lib/logger";
import {
  loadPricing,
  refreshRegistrySource,
  SOURCE_LABELS,
  syncModelRegistry,
} from "@/lib/queries/models";
import { repriceUnpricedTokenUsage } from "@/lib/queries/usage";
import type { RegistrySource } from "@/lib/usage/registry";

/**
 * Steps for {@link import("./sync-model-registry").syncModelRegistryWorkflow}.
 *
 * Deliberately a separate module from the workflow function. A `"use workflow"`
 * function is compiled into a sandboxed VM with no Node.js access, and the
 * sandbox check applies to everything its module imports — `next/cache` reaches
 * it transitively through `@/lib/queries/usage`. Steps have full Node access, so
 * keeping them here leaves the workflow module a pure orchestrator.
 *
 * Every return value is serialised into the run journal, so these stay small:
 * the merged registry is ~6,000 entries and is handed between steps through the
 * Redis cache rather than through the journal. Journal I/O is encrypted, so
 * source health and repricing outcomes are also written to the run's default
 * stream (`npx workflow inspect streams --runId <id>` / the Vercel run page).
 */

/** Retries after the first attempt, so a step gets 4 tries in total. */
const MAX_STEP_RETRIES = 3;

type RegistrySyncEvent =
  | {
      type: "source";
      source: RegistrySource;
      entries: number;
      degraded: boolean;
      error: string | null;
    }
  | {
      type: "reprice";
      repriced: number;
      degraded: boolean;
      error: string | null;
    };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function emitSyncEvent(event: RegistrySyncEvent) {
  const writable = getWritable<RegistrySyncEvent>();
  const writer = writable.getWriter();
  try {
    await writer.write(event);
  } finally {
    writer.releaseLock();
  }
}

/**
 * Warm one source's cache, retrying a transient outage before giving up on it.
 *
 * The failure has to reach this step boundary for the retry to happen at all,
 * which is why `refreshRegistrySource` rejects rather than degrading. Only once
 * the attempts are spent does the source degrade to an empty layer, so a source
 * that stays down narrows the merge instead of failing the run — the property
 * the inline sync had, now with retries in front of it.
 *
 * `degraded` is written to the run stream (and still returned from the step).
 * Journal I/O is encrypted, so `npx workflow inspect streams --runId <id>`
 * (then decrypt) is the log, not the run return value. A degraded source still
 * lets lower-precedence sources win the merge for models they both carry, and
 * the upsert is unconditional — see the follow-up on not downgrading a row when
 * its source is missing.
 */
export async function refreshSource(source: RegistrySource) {
  "use step";

  try {
    const entries = await refreshRegistrySource(source);
    await emitSyncEvent({
      type: "source",
      source,
      entries,
      degraded: false,
      error: null,
    });
    return { source, entries, degraded: false };
  } catch (error) {
    // `attempt` counts from 1 and the runtime stops retrying once it reaches
    // `maxRetries + 1`, so while it is within that budget a rethrow buys another
    // attempt. On the final one a rethrow would fail the whole run instead.
    const { attempt } = getStepMetadata();
    if (attempt <= MAX_STEP_RETRIES) throw error;

    logWarning(`Skipped ${SOURCE_LABELS[source]} after exhausting retries`, {
      errorId: ERROR_IDS.USAGE_INGEST_FAILED,
      error: errorMessage(error),
      attempt,
    });
    await emitSyncEvent({
      type: "source",
      source,
      entries: 0,
      degraded: true,
      error: errorMessage(error),
    });
    return { source, entries: 0, degraded: true };
  }
}
refreshSource.maxRetries = MAX_STEP_RETRIES;

export async function mergeAndUpsert() {
  "use step";

  // Re-reads each source from the Redis cache the fetch steps just warmed.
  const { rows } = await syncModelRegistry();
  return { rows };
}

/**
 * Heal `token_usage` rows whose model had no price when they were ingested.
 * Best-effort: the registry is already persisted by this point, so a failure
 * after retries defers repricing to the next run rather than undoing the sync.
 * The step must throw while attempts remain — catching on the first failure
 * would skip the retry budget.
 */
export async function repriceFromRegistry() {
  "use step";

  try {
    const result = await repriceUnpricedTokenUsage(await loadPricing());
    await emitSyncEvent({
      type: "reprice",
      repriced: result.repriced,
      degraded: false,
      error: null,
    });
    return result.repriced;
  } catch (error) {
    const { attempt } = getStepMetadata();
    if (attempt <= MAX_STEP_RETRIES) throw error;

    logWarning("Skipped repricing during model registry sync", {
      errorId: ERROR_IDS.USAGE_INGEST_FAILED,
      error: errorMessage(error),
      attempt,
    });
    await emitSyncEvent({
      type: "reprice",
      repriced: 0,
      degraded: true,
      error: errorMessage(error),
    });
    return 0;
  }
}
repriceFromRegistry.maxRetries = MAX_STEP_RETRIES;

/**
 * Publish the refreshed registry. `models:providers` carries the model and
 * provider display names with a multi-day life, so without this the page would
 * show refreshed costs beside stale names for the rest of that window.
 * Closes the run stream so inspect sees a completed log rather than an open
 * one.
 */
export async function publishRegistry() {
  "use step";

  revalidateTag("usage", "max");
  revalidateTag("models:providers", "max");
  await getWritable().close();
}
