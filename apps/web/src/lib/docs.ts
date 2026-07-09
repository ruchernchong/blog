import fs from "node:fs";
import path from "node:path";

const DOCS_DIR = path.resolve(process.cwd(), "src/docs/content");

function stripFrontmatter(content: string): string {
  return content.replace(/^---[\s\S]*?---\n*/, "");
}

export function getDocContent(slug: string): string | null {
  const filePath = path.join(DOCS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return stripFrontmatter(raw);
}
