import { REGISTRY_SOURCES } from "@workspace/usage/registry";
import {
  mergeAndUpsert,
  publishRegistry,
  refreshSource,
  repriceFromRegistry,
} from "./sync-model-registry.steps";

/**
 * Refresh the `model` registry from its live sources, then reprice and publish.
 *
 * This used to run inline inside `POST /api/usage/ingest`, wrapped in a
 * try/catch that downgraded every failure to a `logWarning`. That had three
 * problems, all of which this addresses:
 *
 *   - **Failures were invisible.** A missing `model` table went unnoticed for a
 *     week because each ingest silently skipped the sync while still returning
 *     `200`. A workflow run is either succeeded or visibly failed.
 *   - **It sat on the request path.** Each ingest POST synchronously fetched
 *     several megabytes and upserted thousands of rows before responding.
 *   - **Retries were all-or-nothing.** One failed source lost the whole run,
 *     including the other fetches. Each source is now its own retried step.
 *
 * This module is a pure orchestrator: the actual work lives in
 * `./sync-model-registry.steps`, because a `"use workflow"` function is compiled
 * into a sandbox with no Node.js access and that restriction extends to its
 * module's imports.
 */
export async function syncModelRegistryWorkflow() {
  "use workflow";

  // One step per source. A source that is down or rate-limited retries on its
  // own and, if it stays down, narrows the merge rather than failing the run —
  // reporting `degraded: true` on the stream and in the (encrypted) return value.
  const sources = await Promise.all(REGISTRY_SOURCES.map(refreshSource));

  const { rows } = await mergeAndUpsert();
  const repriced = await repriceFromRegistry();
  await publishRegistry();

  return { sources, rows, repriced };
}
