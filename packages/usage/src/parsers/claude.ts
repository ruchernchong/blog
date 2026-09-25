import type { UsageEvent } from "../types";
import { eachJsonLine, listFiles, pathExists, totalBytes } from "./shared";
import type { AgentParseResult } from "./stats";

const CLAUDE_DIR = "~/.claude/projects";

/**
 * Parse Claude Code transcripts (`~/.claude/projects/**\/*.jsonl`).
 *
 * Each assistant message carries `message.usage` with input/output and the two
 * cache token kinds. Lines are deduped by `message.id` because sidechains and
 * resumed sessions repeat the same assistant message across files.
 *
 * `output_tokens` includes thinking, reported in
 * `output_tokens_details.thinking_tokens`; we split it into its own bucket so
 * the five buckets stay exclusive.
 */

interface ClaudeUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens_details?: { thinking_tokens?: number };
}

interface ClaudeLine {
  type?: string;
  timestamp?: string;
  requestId?: string;
  uuid?: string;
  message?: {
    id?: string;
    model?: string;
    usage?: ClaudeUsage;
  };
}

export async function detect(): Promise<boolean> {
  return pathExists(CLAUDE_DIR);
}

export async function parse(): Promise<AgentParseResult> {
  const files = await listFiles(CLAUDE_DIR, ".jsonl");
  const events: UsageEvent[] = [];
  const seen = new Map<string, UsageEvent>();

  for (const file of files) {
    await eachJsonLine(file, (record) => {
      const line = record as ClaudeLine;
      const usage = line.message?.usage;
      const model = line.message?.model;
      if (!usage || !model || model === "<synthetic>") return;

      const output = usage.output_tokens ?? 0;
      const reasoning = usage.output_tokens_details?.thinking_tokens ?? 0;
      const tokens = {
        input: usage.input_tokens ?? 0,
        output: Math.max(0, output - reasoning),
        cacheRead: usage.cache_read_input_tokens ?? 0,
        cacheWrite: usage.cache_creation_input_tokens ?? 0,
        reasoning,
      };

      // Streaming repeats the message.id per content block and usage grows
      // until the final line, so keep the largest value per field.
      const dedupeKey = line.message?.id ?? line.requestId ?? line.uuid;
      const existing = dedupeKey ? seen.get(dedupeKey) : undefined;
      if (existing) {
        for (const key of Object.keys(tokens) as (keyof typeof tokens)[]) {
          existing.tokens[key] = Math.max(existing.tokens[key], tokens[key]);
        }
        return;
      }

      const event: UsageEvent = {
        ts: line.timestamp ?? "",
        agent: "claude",
        model,
        tokens,
      };
      events.push(event);
      if (dedupeKey) seen.set(dedupeKey, event);
    });
  }

  return {
    events: events.filter((event) => event.ts),
    files: files.length,
    bytes: await totalBytes(files),
  };
}
