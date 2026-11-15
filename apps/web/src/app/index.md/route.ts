import { getLlmsContent } from "@/lib/llms";

/**
 * The homepage as Markdown. A request for `/` that accepts `text/markdown` is
 * rewritten here (next.config.ts); browsers keep getting the HTML page.
 */
export async function GET() {
  const content = await getLlmsContent();

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      Vary: "Accept",
    },
  });
}
