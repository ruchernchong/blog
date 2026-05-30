import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

/** Resolve a leading `~` to the user's home directory. */
export function expandHome(path: string): string {
  return path.startsWith("~") ? join(homedir(), path.slice(1)) : path;
}

/** Whether a path exists (file or directory). */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(expandHome(path));
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively list files under `dir` whose name ends with `suffix`.
 * Missing directories yield an empty list rather than throwing.
 */
export async function listFiles(
  dir: string,
  suffix: string,
): Promise<string[]> {
  const root = expandHome(dir);
  const out: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true }).catch(
      () => null,
    );
    if (!entries) return; // unreadable / missing directory
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith(suffix)) {
        out.push(full);
      }
    }
  }

  await walk(root);
  return out;
}

/**
 * Stream a JSONL file line by line, invoking `onRecord` with each parsed object.
 * Malformed lines are skipped silently (agent logs occasionally contain partials).
 */
export async function eachJsonLine(
  file: string,
  onRecord: (record: unknown) => void,
): Promise<void> {
  const stream = createReadStream(file, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      onRecord(JSON.parse(trimmed));
    } catch {
      // skip malformed line
    }
  }
}
