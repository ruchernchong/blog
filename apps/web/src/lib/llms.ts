import { and, desc, eq, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from "@/config";
import { db, posts } from "@/schema";

const DOCS_URL = "https://docs.ruchern.dev";

/**
 * The site overview in Markdown. Served as `/llms.txt`, and as the homepage
 * for clients that ask for `text/markdown` (see the rewrites in next.config.ts).
 */
export async function getLlmsContent() {
  "use cache";
  cacheTag("posts:list");
  cacheLife("max");

  const publishedPosts = await db
    .select({
      title: posts.title,
      summary: posts.summary,
      metadata: posts.metadata,
    })
    .from(posts)
    .where(and(eq(posts.status, "published"), isNull(posts.deletedAt)))
    .orderBy(desc(posts.publishedAt))
    .limit(10);

  return `# ${SITE_NAME}'s Portfolio

> ${SITE_DESCRIPTION}

## About

This is the personal portfolio and blog of Ru Chern Chong, featuring:
- Technical blog posts about web development, Next.js, and modern JavaScript
- Real-time analytics dashboard for site visitors
- Custom-built content management system
- Privacy-focused visitor tracking

## When to use this site

Reach for ruchern.dev when you need:
- Ru Chern's own write-ups on TypeScript, Git, GitHub CLI, React and developer tooling. Each post is a short, practical explanation with code
- Facts about Ru Chern: role, work history and projects (see /about and /projects)
- His measured coding-agent token usage by model and provider (see /usage)

Do not use it as a general-purpose API. The write endpoints (usage ingestion and the MCP server) only accept an OAuth token that belongs to the site's admin account.

## How to call it

- Send \`Accept: text/markdown\` to ${BASE_URL}/ for this overview as Markdown. An unknown path answers with a Markdown 404 that links back here
- Read posts at ${BASE_URL}/blog/<slug>, discover them through ${BASE_URL}/sitemap.xml or ${BASE_URL}/feed.xml
- Read ${BASE_URL}/openapi.json before calling the HTTP API; API errors are JSON with \`error\`, \`message\` and \`hint\`
- Discover OAuth 2.1 (Authorization Code with PKCE, dynamic client registration) at ${BASE_URL}/.well-known/oauth-authorization-server
- Connect an MCP client to ${BASE_URL}/api/mcp or https://mcp.ruchern.dev/mcp (OAuth, \`mcp\` scope, admin account)
- Integration guides: ${DOCS_URL}

## Key Pages

- Home: ${BASE_URL}/
- Blog: ${BASE_URL}/blog
- Dashboard: ${BASE_URL}/dashboard
- Projects: ${BASE_URL}/projects
- About: ${BASE_URL}/about

## Recent Blog Posts

${publishedPosts.map((post) => `- [${post.title}](${BASE_URL}${post.metadata.canonical})\n  ${post.summary || ""}`).join("\n\n")}

## Technology Stack

Built with cutting-edge technologies:

### Frontend
- Next.js 16 (App Router, React Server Components)
- React 19
- Tailwind CSS v4
- TypeScript

### Backend & Data
- Neon PostgreSQL with Drizzle ORM
- Upstash Redis for caching
- Better Auth for authentication

### Content & Features
- MDX blog posts with next-mdx-remote
- Built-in CMS at /studio for content management
- PostHog-backed dashboard analytics
- Real-time visitor statistics visualization
- SEO optimization with structured data

## API Routes

The HTTP API is described in OpenAPI 3.1 at ${BASE_URL}/openapi.json:
- /api/usage/ingest - Token usage ingestion (OAuth, admin)
- /api/mcp - Model Context Protocol server for content management (OAuth, admin)
- /.well-known/oauth-authorization-server - OAuth 2.1 server metadata

## Contact & Links

- Website: ${BASE_URL}
- GitHub: https://github.com/ruchernchong
- Source code: https://github.com/ruchernchong/blog
- API and integration docs: ${DOCS_URL}

## Technical Details

- Monorepo structure using Turborepo
- Database-backed content with migrations
- Analytics instrumentation with PostHog and Vercel Analytics
- Optimized images and caching strategies
- Core Web Vitals monitoring
`;
}
