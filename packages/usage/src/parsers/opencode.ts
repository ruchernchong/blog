import { statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { UsageEvent } from "../types";

/**
 * Parse OpenCode usage from its SQLite store (`opencode.db`).
 *
 * Unlike Claude/Codex (JSONL files), OpenCode persists sessions in SQLite. Each
 * assistant row in the `message` table holds a JSON `data` blob with `modelID`,
 * `providerID`, and a `tokens` object. OpenCode is multi-provider (openai,
 * fireworks-ai, ollama, opencode, opencode-go), so the provider is carried
 * per-event rather than derived from the agent.
 *
 * Token arithmetic (verified against the live DB): `total = input + output +
 * cache.read + cache.write` with `input` already excluding cache reads, and
 * `reasoning` a subset of `output`. We split `output` into an exclusive bucket
 * (`output - reasoning`) to match the Claude/Codex convention where the five
 * buckets sum to the true total.
 */

interface OpenCodeMessage {
  role?: string;
  time?: { created?: number };
  modelID?: string;
  providerID?: string;
  tokens?: {
    input?: number;
    output?: number;
    reasoning?: number;
    cache?: { read?: number; write?: number };
  };
}

/** Resolve OpenCode's SQLite path, honouring `$XDG_DATA_HOME`. */
function dbPath(): string {
  const dataHome =
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  return join(dataHome, "opencode", "opencode.db");
}

/**
 * Map one OpenCode `message.data` blob to a usage event, or `null` if it is not
 * a priced assistant message. Pure (no DB) so it can be unit-tested.
 */
export function mapMessage(data: OpenCodeMessage): UsageEvent | null {
  if (data.role !== "assistant" || !data.tokens) return null;

  const created = data.time?.created;
  if (typeof created !== "number") return null;

  const output = data.tokens.output ?? 0;
  const reasoning = data.tokens.reasoning ?? 0;

  return {
    ts: new Date(created).toISOString(),
    agent: "opencode",
    provider: data.providerID || "unknown",
    model: data.modelID || "unknown",
    tokens: {
      input: data.tokens.input ?? 0,
      // Split OpenAI-style nested reasoning out of `output` into its own bucket.
      output: Math.max(0, output - reasoning),
      cacheRead: data.tokens.cache?.read ?? 0,
      cacheWrite: data.tokens.cache?.write ?? 0,
      reasoning,
    },
  };
}

export async function detect(): Promise<boolean> {
  try {
    return statSync(dbPath()).isFile();
  } catch {
    return false;
  }
}

export async function parse(): Promise<UsageEvent[]> {
  const events: UsageEvent[] = [];

  // Read-only open avoids write locks and won't create -wal/-shm files; a live
  // WAL just means we may read a slightly stale snapshot, fine for daily rollups.
  const db = new DatabaseSync(dbPath(), { readOnly: true });
  try {
    const stmt = db.prepare("SELECT data FROM message");
    for (const row of stmt.iterate()) {
      const raw = (row as { data?: string }).data;
      if (!raw) continue;
      let parsed: OpenCodeMessage;
      try {
        parsed = JSON.parse(raw) as OpenCodeMessage;
      } catch {
        continue; // skip malformed blob
      }
      const event = mapMessage(parsed);
      if (event) events.push(event);
    }
  } finally {
    db.close();
  }

  return events.filter((event) => event.ts);
}
