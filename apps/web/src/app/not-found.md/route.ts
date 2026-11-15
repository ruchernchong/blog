import { BASE_URL } from "@/config";

/**
 * The 404 page as Markdown. A request for an unknown path that accepts
 * `text/markdown` is rewritten here (next.config.ts); browsers keep getting the
 * HTML page from `not-found.tsx`.
 */
export function GET() {
  const content = `# 404: Page not found

The page you requested does not exist on ruchern.dev. Check the URL, or find what you need from one of these:

- [llms.txt](${BASE_URL}/llms.txt): an overview of the site and its recent posts
- [Sitemap](${BASE_URL}/sitemap.xml): every public page
- [Blog](${BASE_URL}/blog): all published posts
- [OpenAPI specification](${BASE_URL}/openapi.json): the HTTP API
`;

  return new Response(content, {
    status: 404,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
