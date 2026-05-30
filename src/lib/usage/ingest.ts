import * as z from "zod";

/**
 * Wire contract for `POST /api/usage/ingest`.
 *
 * The local `usage:ingest` script parses local agent logs (which only exist on
 * the machine that ran the agents), prices and folds them into daily aggregates,
 * then POSTs those rows here. The route upserts them using the deployment's own
 * `DATABASE_URL`, so production data can be ingested without the prod connection
 * string ever touching the local machine.
 *
 * Shapes must match the `token_usage` insert: token counts are non-negative
 * integers; `costUsd` is a fixed-point decimal string (6 dp, as produced by
 * `Number.toFixed(6)`) or `null` when the model could not be priced ("N.A.",
 * distinct from a genuine `0`).
 */

const nonNegativeInt = z.number().int().nonnegative();

export const usageRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  agent: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  inputTokens: nonNegativeInt,
  outputTokens: nonNegativeInt,
  cacheReadTokens: nonNegativeInt,
  cacheWriteTokens: nonNegativeInt,
  reasoningTokens: nonNegativeInt,
  totalTokens: nonNegativeInt,
  costUsd: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "expected a decimal string")
    .nullable(),
  messages: nonNegativeInt,
});

/**
 * A single request carries every daily aggregate the ingest produced. The cap is
 * a safety bound, comfortably above a multi-year, multi-agent history, and keeps
 * the JSON body within the serverless function's request-size limit.
 */
export const usageIngestSchema = z.object({
  rows: z.array(usageRowSchema).min(1).max(20000),
});

export type UsageRow = z.infer<typeof usageRowSchema>;
export type UsageIngestPayload = z.infer<typeof usageIngestSchema>;
