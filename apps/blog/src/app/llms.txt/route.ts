import { and, desc, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from "@/config";
import { db, posts } from "@/schema";

export const GET = async () => {
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

  const content = `# ${SITE_NAME}'s Portfolio

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
- tRPC for type-safe APIs
- Better Auth for authentication

### Content & Features
- MDX blog posts with next-mdx-remote
- Built-in CMS at /studio for content management
- Custom analytics with privacy-focused IP hashing
- Real-time visitor statistics visualization
- SEO optimization with structured data

## API Routes

Public API endpoints:
- /api/trpc/* - tRPC API routes (type-safe API layer)
- /api/analytics - Analytics data endpoints
- /api/studio/posts - Content management endpoints (authenticated)

## Contact & Links

- Website: ${BASE_URL}
- GitHub: https://github.com/ruchernchong
- Email: Contact form available on website

## Technical Details

- Monorepo structure using Turborepo
- Database-backed content with migrations
- Custom privacy-focused analytics (IP hashing)
- Optimized images and caching strategies
- Core Web Vitals monitoring
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
    },
  });
};
