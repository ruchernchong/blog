import { and, desc, eq, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from "@/config";
import { db, posts } from "@/schema";

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

## Key Pages

- Home: ${BASE_URL}/
- Blog: ${BASE_URL}/blog
- Dashboard: ${BASE_URL}/dashboard
- Projects: ${BASE_URL}/projects
- About: ${BASE_URL}/about

## Recent Blog Posts

${publishedPosts.map((post) => `- [${post.title}](${post.metadata.canonical})\n  ${post.summary || ""}`).join("\n\n")}

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

## Technical Details

- Monorepo structure using Turborepo
- Database-backed content with migrations
- Analytics instrumentation with PostHog and Vercel Analytics
- Optimized images and caching strategies
- Core Web Vitals monitoring
`;
}
