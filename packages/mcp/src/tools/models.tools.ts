import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { entryToRow } from "@/lib/queries/model-registry";
import { repriceAndRevalidateUsage } from "@/lib/queries/models";
import { db, model } from "@/schema";

/**
 * MCP tools for the curated model-pricing overrides that back the `/usage`
 * page. Overrides are DB rows (`model` table, `is_override = true`) that win the
 * merge over the live LiteLLM / models.dev sources, so a mispriced or
 * newly-released model is fixed as data — no code change or redeploy.
 *
 * Rates are USD per 1,000,000 tokens. After an upsert we reprice any `N.A.`
 * (`cost IS NULL`) `token_usage` rows and revalidate the page immediately;
 * changing an *already-priced* rate only takes effect on the next full
 * `pnpm usage:ingest` (which recomputes every row).
 */

function serialise(output: unknown): CallToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output) }],
    structuredContent: output as Record<string, unknown>,
  };
}

function rowToOutput(row: typeof model.$inferSelect) {
  return {
    provider: row.provider,
    id: row.id,
    displayName: row.displayName,
    inputRate: row.inputRate,
    outputRate: row.outputRate,
    cacheReadRate: row.cacheReadRate,
    cacheWriteRate: row.cacheWriteRate,
    contextLimit: row.contextLimit,
    releaseDate: row.releaseDate,
    source: row.source,
    isOverride: row.isOverride,
    aliasTarget: row.aliasTarget,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listModelOverridesHandler(args: {
  provider?: string;
}): Promise<CallToolResult> {
  const conditions = [eq(model.isOverride, true)];
  if (args.provider) conditions.push(eq(model.provider, args.provider));

  const rows = await db
    .select()
    .from(model)
    .where(and(...conditions))
    .orderBy(asc(model.provider), asc(model.id));

  const output = { models: rows.map(rowToOutput), total: rows.length };
  return serialise(output);
}

export async function getModelHandler(args: {
  provider: string;
  id: string;
}): Promise<CallToolResult> {
  const [row] = await db
    .select()
    .from(model)
    .where(and(eq(model.provider, args.provider), eq(model.id, args.id)))
    .limit(1);

  const output = { model: row ? rowToOutput(row) : null };
  return serialise(output);
}

export async function upsertModelOverrideHandler(args: {
  provider: string;
  id: string;
  displayName?: string;
  inputRate?: number;
  outputRate?: number;
  cacheReadRate?: number;
  cacheWriteRate?: number;
  contextLimit?: number;
  releaseDate?: string;
  aliasTarget?: string;
}): Promise<CallToolResult> {
  const row = entryToRow({
    provider: args.provider,
    id: args.id,
    displayName: args.displayName,
    rate:
      args.inputRate != null || args.outputRate != null
        ? {
            input: args.inputRate,
            output: args.outputRate,
            cacheRead: args.cacheReadRate,
            cacheWrite: args.cacheWriteRate,
          }
        : undefined,
    contextLimit: args.contextLimit,
    releaseDate: args.releaseDate,
    aliasTarget: args.aliasTarget,
    source: "override",
    isOverride: true,
  });

  const [saved] = await db
    .insert(model)
    .values(row)
    .onConflictDoUpdate({
      target: [model.provider, model.id],
      set: { ...row, updatedAt: new Date() },
    })
    .returning();

  await repriceAndRevalidateUsage();

  return serialise({ model: rowToOutput(saved) });
}

export async function deleteModelOverrideHandler(args: {
  provider: string;
  id: string;
}): Promise<CallToolResult> {
  // Guard on is_override so a source-derived row is never deleted.
  const deleted = await db
    .delete(model)
    .where(
      and(
        eq(model.provider, args.provider),
        eq(model.id, args.id),
        eq(model.isOverride, true),
      ),
    )
    .returning({ provider: model.provider, id: model.id });

  if (deleted.length > 0) await repriceAndRevalidateUsage();

  return serialise({ deleted: deleted.length > 0 });
}

const modelOutputSchema = z.object({
  provider: z.string(),
  id: z.string(),
  displayName: z.string().nullable(),
  inputRate: z.string().nullable(),
  outputRate: z.string().nullable(),
  cacheReadRate: z.string().nullable(),
  cacheWriteRate: z.string().nullable(),
  contextLimit: z.number().nullable(),
  releaseDate: z.string().nullable(),
  source: z.string(),
  isOverride: z.boolean(),
  aliasTarget: z.string().nullable(),
  updatedAt: z.string(),
});

export function registerModelTools(server: McpServer): void {
  server.registerTool(
    "list_model_overrides",
    {
      title: "List Model Overrides",
      description:
        "List curated model-pricing overrides (the model table rows with is_override = true), optionally filtered by provider.",
      inputSchema: z.object({
        provider: z
          .string()
          .optional()
          .describe("Filter overrides to a single provider, e.g. 'openai'"),
      }),
      outputSchema: z.object({
        models: z.array(modelOutputSchema),
        total: z.number(),
      }),
      annotations: { readOnlyHint: true },
    },
    (args) => listModelOverridesHandler(args),
  );

  server.registerTool(
    "get_model",
    {
      title: "Get Model",
      description:
        "Get a single model registry row by (provider, id), including its merged pricing, metadata, and source provenance.",
      inputSchema: z.object({
        provider: z.string().describe("Inference provider, e.g. 'anthropic'"),
        id: z.string().describe("Model id/slug as it appears in logs"),
      }),
      outputSchema: z.object({
        model: modelOutputSchema.nullable(),
      }),
      annotations: { readOnlyHint: true },
    },
    (args) => getModelHandler(args),
  );

  server.registerTool(
    "upsert_model_override",
    {
      title: "Upsert Model Override",
      description:
        "Create or update a curated pricing/metadata override for a model. Rates are USD per 1,000,000 tokens and win over the live LiteLLM/models.dev sources. Set aliasTarget to price/label from another model instead. Newly-priced (N.A.) rows are healed immediately; a changed rate on already-priced rows applies on the next `pnpm usage:ingest`.",
      inputSchema: z.object({
        provider: z.string().describe("Inference provider, e.g. 'openai'"),
        id: z.string().describe("Model id/slug as it appears in logs"),
        displayName: z
          .string()
          .optional()
          .describe("Friendly display name shown on /usage"),
        inputRate: z.number().optional().describe("USD per 1M input tokens"),
        outputRate: z.number().optional().describe("USD per 1M output tokens"),
        cacheReadRate: z
          .number()
          .optional()
          .describe("USD per 1M cache-read tokens"),
        cacheWriteRate: z
          .number()
          .optional()
          .describe("USD per 1M cache-write tokens"),
        contextLimit: z.number().optional().describe("Max context tokens"),
        releaseDate: z.string().optional().describe("Release date, YYYY-MM-DD"),
        aliasTarget: z
          .string()
          .optional()
          .describe("Resolve price/label from this model id instead"),
      }),
      outputSchema: z.object({ model: modelOutputSchema }),
      annotations: { idempotentHint: true },
    },
    (args) => upsertModelOverrideHandler(args),
  );

  server.registerTool(
    "delete_model_override",
    {
      title: "Delete Model Override",
      description:
        "Delete a curated model override by (provider, id). Only rows with is_override = true can be deleted; source-derived rows are refreshed on the next ingest.",
      inputSchema: z.object({
        provider: z.string().describe("Inference provider, e.g. 'openai'"),
        id: z.string().describe("Model id/slug as it appears in logs"),
      }),
      outputSchema: z.object({ deleted: z.boolean() }),
      annotations: { destructiveHint: true },
    },
    (args) => deleteModelOverrideHandler(args),
  );
}
