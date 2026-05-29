import type { UsageEvent } from "../types";
import { eachJsonLine, listFiles, pathExists } from "./shared";

const CODEX_DIRS = ["~/.codex/sessions", "~/.codex/archived_sessions"];

/**
 * Parse Codex CLI session logs (`~/.codex/sessions/**\/*.jsonl`).
 *
 * Each session emits one `token_count` event per turn. `total_token_usage` is
 * cumulative, so we sum `last_token_usage` (the per-turn delta) — verified to
 * equal the final cumulative total. The model is taken from the latest
 * `turn_context`/`session_meta` seen in the file.
 *
 * OpenAI nests cached tokens inside `input_tokens` and reasoning inside
 * `output_tokens`, so we split them into mutually-exclusive buckets to match the
 * Claude convention (fields sum to the true total).
 */

interface CodexTokenUsage {
  input_tokens?: number;
  cached_input_tokens?: number;
  output_tokens?: number;
  reasoning_output_tokens?: number;
}

interface CodexLine {
  type?: string;
  timestamp?: string;
  payload?: {
    type?: string;
    model?: string;
    info?: {
      last_token_usage?: CodexTokenUsage;
    };
  };
}

export async function detect(): Promise<boolean> {
  for (const dir of CODEX_DIRS) {
    if (await pathExists(dir)) return true;
  }
  return false;
}

export async function parse(): Promise<UsageEvent[]> {
  const files: string[] = [];
  for (const dir of CODEX_DIRS) {
    files.push(...(await listFiles(dir, ".jsonl")));
  }

  const events: UsageEvent[] = [];

  for (const file of files) {
    let currentModel = "unknown";

    await eachJsonLine(file, (record) => {
      const line = record as CodexLine;
      const payload = line.payload;
      if (!payload) return;

      // Track the active model from session_meta / turn_context records.
      if (typeof payload.model === "string" && payload.model) {
        currentModel = payload.model;
      }

      if (payload.type !== "token_count") return;
      const usage = payload.info?.last_token_usage;
      if (!usage) return;

      const inputTotal = usage.input_tokens ?? 0;
      const cached = usage.cached_input_tokens ?? 0;
      const outputTotal = usage.output_tokens ?? 0;
      const reasoning = usage.reasoning_output_tokens ?? 0;

      events.push({
        ts: line.timestamp ?? "",
        agent: "codex",
        model: currentModel,
        tokens: {
          // Split OpenAI's nested counts into exclusive buckets.
          input: Math.max(0, inputTotal - cached),
          output: Math.max(0, outputTotal - reasoning),
          cacheRead: cached,
          cacheWrite: 0,
          reasoning,
        },
      });
    });
  }

  return events.filter((event) => event.ts);
}
