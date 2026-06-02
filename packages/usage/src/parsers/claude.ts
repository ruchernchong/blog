import type { UsageEvent } from "../types";
import { eachJsonLine, listFiles, pathExists } from "./shared";

const CLAUDE_DIR = "~/.claude/projects";

/**
 * Parse Claude Code transcripts (`~/.claude/projects/**\/*.jsonl`).
 *
 * Each assistant message carries `message.usage` with input/output and the two
 * cache token kinds. Lines are deduped by `message.id` because sidechains and
 * resumed sessions repeat the same assistant message across files.
 */

interface ClaudeUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
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

export async function parse(): Promise<UsageEvent[]> {
  const files = await listFiles(CLAUDE_DIR, ".jsonl");
  const events: UsageEvent[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    await eachJsonLine(file, (record) => {
      const line = record as ClaudeLine;
      const usage = line.message?.usage;
      const model = line.message?.model;
      if (!usage || !model || model === "<synthetic>") return;

      const dedupeKey = line.message?.id ?? line.requestId ?? line.uuid;
      if (dedupeKey) {
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
      }

      events.push({
        ts: line.timestamp ?? "",
        agent: "claude",
        model,
        tokens: {
          input: usage.input_tokens ?? 0,
          output: usage.output_tokens ?? 0,
          cacheRead: usage.cache_read_input_tokens ?? 0,
          cacheWrite: usage.cache_creation_input_tokens ?? 0,
          reasoning: 0,
        },
      });
    });
  }

  return events.filter((event) => event.ts);
}
