import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const webSrc = path.resolve(__dirname, "../../../apps/web/src");
const IMPORT_PATTERN =
  /(?:import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function resolveLocal(from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = path.join(webSrc, specifier.slice(2));
  else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(from), specifier);
  } else return null;

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  const found = candidates.find((c) => existsSync(c) && statSync(c).isFile());
  if (!found) throw new Error(`Cannot resolve "${specifier}" from ${from}`);
  return found;
}

// Statically walks every runtime import reachable from server.ts (type-only
// imports are erased at build time) and collects Next.js-only specifiers.
function findNextImports(entry: string): string[] {
  const seen = new Set<string>();
  const offending: string[] = [];
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);

    for (const match of readFileSync(file, "utf8").matchAll(IMPORT_PATTERN)) {
      if (match[1]) continue;
      const specifier = match[2] ?? match[3];
      if (
        specifier === "next" ||
        specifier.startsWith("next/") ||
        specifier === "server-only"
      ) {
        offending.push(`${path.relative(webSrc, file)} -> ${specifier}`);
        continue;
      }
      const resolved = resolveLocal(file, specifier);
      if (resolved) queue.push(resolved);
    }
  }

  return offending;
}

describe("server import graph", () => {
  it("should not reach Next.js or server-only from server.ts", () => {
    expect(findNextImports(path.resolve(__dirname, "server.ts"))).toEqual([]);
  });
});
