import "dotenv/config";
import { reset } from "drizzle-seed";
import readingTime from "reading-time";
import * as schema from "@/schema";
import { db, type PostMetadata, posts, user } from "@/schema";

// Safety check: Only allow seeding in development
const checkEnvironment = () => {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ ERROR: Cannot seed database in production environment!");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL || "";
  const productionDomains = ["vercel", "production", "prod"];

  if (
    productionDomains.some((domain) =>
      databaseUrl.toLowerCase().includes(domain),
    )
  ) {
    console.error(
      "❌ ERROR: DATABASE_URL appears to be a production database!",
    );
    console.error("   Seeding is only allowed in development environments.");
    process.exit(1);
  }

  console.log("✅ Environment check passed - proceeding with seeding");
};

// Generate metadata for a blog post
const generateMetadata = (
  title: string,
  summary: string,
  slug: string,
  content: string,
): PostMetadata => {
  const { text: readingTimeText } = readingTime(content);
  const postUrl = `/blog/${slug}`;
  const now = new Date().toISOString();

  return {
    readingTime: readingTimeText,
    description: summary,
    canonical: postUrl,
    openGraph: {
      title,
      siteName: "Ru Chern's Blog",
      description: summary,
      type: "article",
      publishedTime: now,
      url: postUrl,
      images: [`/api/og?title=${encodeURIComponent(title)}`],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: "@ruchernchong",
      title,
      description: summary,
      images: [`/api/og?title=${encodeURIComponent(title)}`],
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      dateModified: now,
      datePublished: now,
      description: summary,
      image: [`/api/og?title=${encodeURIComponent(title)}`],
      url: postUrl,
      author: {
        "@type": "Person",
        name: "Ru Chern Chong",
        url: "/",
      },
    },
  };
};

// Sample blog posts with realistic developer content
const samplePosts = [
  {
    slug: "advanced-typescript-patterns",
    title: "Advanced TypeScript Patterns for Production",
    summary:
      "Explore discriminated unions, branded types, and the builder pattern to write type-safe, maintainable TypeScript code.",
    tags: ["TypeScript", "Web Development", "Best Practices"],
    featured: true,
    status: "published" as const,
    publishedAt: new Date("2024-11-15"),
    content: `# Advanced TypeScript Patterns for Production

TypeScript's type system goes far beyond basic type annotations. In production codebases, leveraging advanced patterns can prevent entire categories of bugs at compile time.

## Discriminated Unions

Discriminated unions are perfect for modelling state machines and API responses:

\`\`\`typescript
type ApiResponse<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function handleResponse<T>(response: ApiResponse<T>) {
  switch (response.status) {
    case "loading":
      return <Spinner />;
    case "success":
      return <DataDisplay data={response.data} />;
    case "error":
      return <ErrorMessage error={response.error} />;
  }
}
\`\`\`

The compiler ensures exhaustive handling—add a new status and TypeScript will flag every switch statement that needs updating.

## Branded Types

Prevent mixing up primitive values that represent different concepts:

\`\`\`typescript
type UserId = string & { readonly brand: unique symbol };
type OrderId = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUser(id: UserId) { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

const userId = createUserId("usr_123");
const orderId = createOrderId("ord_456");

getUser(userId);   // ✓ Compiles
getUser(orderId);  // ✗ Type error!
\`\`\`

## The Builder Pattern

Create fluent APIs with full type safety:

\`\`\`typescript
class QueryBuilder<T extends object = {}> {
  private query: Partial<T> = {};

  where<K extends string, V>(
    key: K,
    value: V
  ): QueryBuilder<T & Record<K, V>> {
    return Object.assign(
      new QueryBuilder<T & Record<K, V>>(),
      { query: { ...this.query, [key]: value } }
    );
  }

  build(): T {
    return this.query as T;
  }
}

const query = new QueryBuilder()
  .where("status", "active")
  .where("limit", 10)
  .build();
// Type: { status: string; limit: number }
\`\`\`

## Conclusion

These patterns require more upfront thinking but pay dividends in large codebases. The compiler becomes your first line of defence against runtime errors.`,
  },
  {
    slug: "nextjs-app-router-best-practices",
    title: "Next.js App Router: Best Practices Guide",
    summary:
      "Master the App Router with patterns for data fetching, caching, server components, and when to reach for client components.",
    tags: ["Next.js", "React", "Web Development"],
    featured: true,
    status: "published" as const,
    publishedAt: new Date("2024-10-28"),
    content: `# Next.js App Router: Best Practices Guide

The App Router represents a paradigm shift in how we build React applications. Here's what I've learned after migrating several production apps.

## Default to Server Components

Server Components are the default for good reason. They:

- Reduce client-side JavaScript bundle size
- Enable direct database access without API routes
- Improve initial page load performance

\`\`\`tsx
// app/posts/page.tsx - This is a Server Component
import { db } from "@/lib/db";

export default async function PostsPage() {
  const posts = await db.query.posts.findMany({
    where: eq(posts.status, "published"),
    orderBy: desc(posts.publishedAt),
  });

  return (
    <main>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  );
}
\`\`\`

## Strategic Use of Client Components

Reach for \`"use client"\` only when you need:

- Event handlers (onClick, onChange)
- State and effects (useState, useEffect)
- Browser-only APIs (localStorage, IntersectionObserver)

\`\`\`tsx
"use client";

import { useState } from "react";

export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? "❤️" : "🤍"}
    </button>
  );
}
\`\`\`

## Data Fetching Patterns

### Parallel Data Fetching

Avoid waterfalls by fetching data in parallel:

\`\`\`tsx
export default async function DashboardPage() {
  // These run in parallel
  const [user, posts, stats] = await Promise.all([
    getUser(),
    getPosts(),
    getStats(),
  ]);

  return <Dashboard user={user} posts={posts} stats={stats} />;
}
\`\`\`

### Streaming with Suspense

For slow data, stream it in:

\`\`\`tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <main>
      <Header />
      <Suspense fallback={<PostsSkeleton />}>
        <SlowPosts />
      </Suspense>
    </main>
  );
}
\`\`\`

## Caching Strategy

Next.js caches aggressively. Understand the layers:

1. **Request Memoisation** - Same fetch in a render is deduped
2. **Data Cache** - fetch results are cached across requests
3. **Full Route Cache** - Static routes are cached at build time

Override when needed:

\`\`\`tsx
// Opt out of caching for real-time data
const data = await fetch(url, { cache: "no-store" });

// Revalidate every 60 seconds
const data = await fetch(url, { next: { revalidate: 60 } });
\`\`\`

## Conclusion

The App Router rewards thinking in terms of data dependencies and render boundaries. Embrace Server Components as the default and you'll ship faster, lighter applications.`,
  },
  {
    slug: "testing-strategies-react",
    title: "Testing Strategies for React Applications",
    summary:
      "A practical guide to testing React apps with Vitest and Testing Library, covering unit tests, integration tests, and when to use each.",
    tags: ["React", "Testing", "Vitest"],
    featured: false,
    status: "published" as const,
    publishedAt: new Date("2024-09-12"),
    content: `# Testing Strategies for React Applications

Good tests give you confidence to refactor and ship quickly. Here's my approach to testing React applications with Vitest and Testing Library.

## The Testing Trophy

I follow Kent C. Dodds' testing trophy:

1. **Static Analysis** (TypeScript, ESLint)
2. **Unit Tests** (Pure functions, hooks)
3. **Integration Tests** (Components with mocked APIs)
4. **E2E Tests** (Critical user journeys)

Most effort goes into integration tests—they provide the best confidence-to-maintenance ratio.

## Unit Testing Pure Functions

Start with the easy wins:

\`\`\`typescript
// utils/format.ts
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

// utils/__tests__/format.test.ts
import { describe, expect, it } from "vitest";
import { formatCurrency } from "../format";

describe("formatCurrency", () => {
  it("formats cents to SGD", () => {
    expect(formatCurrency(1000)).toBe("$10.00");
    expect(formatCurrency(99)).toBe("$0.99");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});
\`\`\`

## Integration Testing Components

Test components as users experience them:

\`\`\`tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "../LoginForm";

describe("LoginForm", () => {
  it("submits credentials and shows success", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByLabelText(/email/i),
      "test@example.com"
    );
    await user.type(
      screen.getByLabelText(/password/i),
      "password123"
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("displays validation errors", async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
\`\`\`

## Mocking API Calls

Use MSW for realistic API mocking:

\`\`\`typescript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("/api/posts", () => {
    return HttpResponse.json([
      { id: "1", title: "First Post" },
      { id: "2", title: "Second Post" },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
\`\`\`

## Testing Hooks

For custom hooks, use \`renderHook\`:

\`\`\`typescript
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "../useCounter";

describe("useCounter", () => {
  it("increments the count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
\`\`\`

## Conclusion

Focus on testing behaviour, not implementation. If your tests break when you refactor internal code, they're testing the wrong thing.`,
  },
  {
    slug: "optimizing-web-vitals",
    title: "Optimising Core Web Vitals for Better UX",
    summary:
      "Practical techniques to improve LCP, CLS, and INP scores, with real examples from production performance audits.",
    tags: ["Performance", "Web Development", "UX"],
    featured: false,
    status: "published" as const,
    publishedAt: new Date("2024-08-20"),
    content: `# Optimising Core Web Vitals for Better UX

Core Web Vitals directly impact user experience and SEO rankings. Here's how to measure and improve each metric.

## Understanding the Metrics

- **LCP (Largest Contentful Paint)**: Time until the main content is visible
- **CLS (Cumulative Layout Shift)**: Visual stability during load
- **INP (Interaction to Next Paint)**: Responsiveness to user input

## Measuring Performance

Use the \`web-vitals\` library for real user monitoring:

\`\`\`typescript
import { onCLS, onINP, onLCP } from "web-vitals";

function sendToAnalytics(metric: Metric) {
  fetch("/api/vitals", {
    method: "POST",
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
    }),
  });
}

onLCP(sendToAnalytics);
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
\`\`\`

## Improving LCP

### Preload Critical Assets

\`\`\`html
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin />
<link rel="preload" href="/hero-image.webp" as="image" />
\`\`\`

### Optimise Images

Use Next.js Image component with proper sizing:

\`\`\`tsx
import Image from "next/image";

export function Hero() {
  return (
    <Image
      src="/hero.webp"
      alt="Hero image"
      width={1200}
      height={600}
      priority // Preloads the LCP image
      sizes="100vw"
    />
  );
}
\`\`\`

### Reduce Server Response Time

- Use edge functions for dynamic content
- Implement stale-while-revalidate caching
- Optimise database queries with proper indexing

## Preventing CLS

### Reserve Space for Dynamic Content

\`\`\`css
.image-container {
  aspect-ratio: 16 / 9;
  background: var(--skeleton);
}

.ad-slot {
  min-height: 250px;
}
\`\`\`

### Avoid Layout-Shifting Font Load

\`\`\`css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-display: swap;
  size-adjust: 100%;
  ascent-override: 90%;
  descent-override: 20%;
}
\`\`\`

## Improving INP

### Yield to the Main Thread

Break up long tasks:

\`\`\`typescript
async function processLargeList(items: Item[]) {
  for (const item of items) {
    processItem(item);

    // Yield every 50ms to allow UI updates
    if (shouldYield()) {
      await scheduler.yield();
    }
  }
}

function shouldYield() {
  return performance.now() - lastYield > 50;
}
\`\`\`

### Debounce Expensive Operations

\`\`\`typescript
import { useDeferredValue } from "react";

function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);

  // Heavy filtering uses deferred value
  const results = useMemo(
    () => items.filter((item) => matches(item, deferredQuery)),
    [deferredQuery]
  );

  return <ResultsList results={results} />;
}
\`\`\`

## Conclusion

Performance optimisation is iterative. Measure first, identify the biggest impact opportunities, and validate improvements with real user data.`,
  },
  {
    slug: "database-performance-tips",
    title: "Database Performance Optimisation Tips",
    summary:
      "Essential techniques for optimising PostgreSQL queries, from proper indexing to query analysis and connection pooling.",
    tags: ["Database", "PostgreSQL", "Performance"],
    featured: false,
    status: "published" as const,
    publishedAt: new Date("2024-07-05"),
    content: `# Database Performance Optimisation Tips

Slow database queries are often the biggest performance bottleneck in web applications. Here's how to identify and fix them.

## Analysing Query Performance

Use \`EXPLAIN ANALYZE\` to understand query execution:

\`\`\`sql
EXPLAIN ANALYZE
SELECT p.*, u.name as author_name
FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.status = 'published'
ORDER BY p.published_at DESC
LIMIT 10;
\`\`\`

Look for:
- **Seq Scan** on large tables (usually bad)
- **Nested Loop** with high row counts
- **Sort** operations on unsorted data

## Effective Indexing

### Create Indexes for Common Queries

\`\`\`sql
-- Index for filtering by status and ordering
CREATE INDEX idx_posts_status_published
ON posts (status, published_at DESC)
WHERE status = 'published';

-- Composite index for frequent joins
CREATE INDEX idx_posts_author_status
ON posts (author_id, status);
\`\`\`

### Partial Indexes

Only index what you query:

\`\`\`sql
-- Only index published posts (smaller, faster)
CREATE INDEX idx_posts_published
ON posts (published_at DESC)
WHERE status = 'published' AND deleted_at IS NULL;
\`\`\`

## Query Optimisation

### Avoid N+1 Queries

Bad:

\`\`\`typescript
const posts = await db.query.posts.findMany();

for (const post of posts) {
  // N additional queries!
  const author = await db.query.users.findFirst({
    where: eq(users.id, post.authorId),
  });
}
\`\`\`

Good:

\`\`\`typescript
const posts = await db.query.posts.findMany({
  with: {
    author: true, // Single query with JOIN
  },
});
\`\`\`

### Use Pagination Properly

Offset-based pagination degrades with large offsets:

\`\`\`typescript
// Slow for large offsets
const posts = await db.query.posts.findMany({
  offset: 10000,
  limit: 10,
});

// Faster: cursor-based pagination
const posts = await db.query.posts.findMany({
  where: lt(posts.id, lastSeenId),
  orderBy: desc(posts.id),
  limit: 10,
});
\`\`\`

## Connection Pooling

Use connection pooling to avoid connection overhead:

\`\`\`typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
\`\`\`

For serverless, use a pooler like Neon's:

\`\`\`typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
\`\`\`

## Monitoring

Track slow queries in production:

\`\`\`sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();
\`\`\`

## Conclusion

Database optimisation is about understanding your query patterns and designing your schema and indexes to support them. Measure before and after every change.`,
  },
  {
    slug: "api-security-essentials",
    title: "API Security Essentials Every Developer Should Know",
    summary:
      "Protect your APIs from common vulnerabilities including injection attacks, authentication bypass, and rate limiting strategies.",
    tags: ["Security", "API", "Web Development"],
    featured: true,
    status: "published" as const,
    publishedAt: new Date("2024-06-18"),
    content: `# API Security Essentials Every Developer Should Know

Security vulnerabilities in APIs can expose sensitive data and compromise entire systems. Here's how to build secure APIs from the start.

## Input Validation

Never trust user input. Validate everything:

\`\`\`typescript
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  status: z.enum(["draft", "published"]),
});

export async function POST(request: Request) {
  const body = await request.json();

  const result = createPostSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  // result.data is now typed and validated
  const post = await createPost(result.data);
  return Response.json(post, { status: 201 });
}
\`\`\`

## Authentication & Authorisation

### Verify Tokens Properly

\`\`\`typescript
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // Check authorisation for this resource
  if (session.userId !== resourceOwnerId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(resource);
}
\`\`\`

### Use Secure Session Management

\`\`\`typescript
// Set secure cookie options
const sessionCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};
\`\`\`

## Rate Limiting

Protect against brute force and DoS attacks:

\`\`\`typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        },
      }
    );
  }

  // Process request...
}
\`\`\`

## Preventing SQL Injection

Always use parameterised queries:

\`\`\`typescript
// NEVER do this
const query = \`SELECT * FROM users WHERE id = '\${userId}'\`;

// Use parameterised queries
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});
\`\`\`

## Security Headers

Set proper security headers:

\`\`\`typescript
// next.config.js
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];
\`\`\`

## Conclusion

Security is not a feature you add later—it's a mindset you adopt from the start. Validate inputs, verify permissions, and assume all external data is malicious.`,
  },
  {
    slug: "accessible-web-forms",
    title: "Building Accessible Web Forms",
    summary:
      "Create forms that work for everyone with proper labelling, error handling, keyboard navigation, and screen reader support.",
    tags: ["Accessibility", "UX", "Web Development"],
    featured: false,
    status: "published" as const,
    publishedAt: new Date("2024-05-10"),
    content: `# Building Accessible Web Forms

Forms are critical interaction points. Making them accessible ensures everyone can use your application.

## Proper Labelling

Every input needs an associated label:

\`\`\`tsx
// Good: Explicit label association
<div>
  <label htmlFor="email">Email address</label>
  <input
    type="email"
    id="email"
    name="email"
    autoComplete="email"
  />
</div>

// Also good: Implicit labelling
<label>
  Email address
  <input type="email" name="email" autoComplete="email" />
</label>
\`\`\`

Never use placeholder as a replacement for labels—it disappears when typing and has poor contrast.

## Error Handling

Make errors clear and actionable:

\`\`\`tsx
function FormField({ error, label, ...props }) {
  const inputId = useId();
  const errorId = \`\${inputId}-error\`;

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
\`\`\`

## Keyboard Navigation

Ensure logical tab order and visible focus:

\`\`\`css
/* Never hide focus outlines without replacement */
input:focus {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* Custom focus style */
input:focus-visible {
  box-shadow: 0 0 0 3px var(--focus-ring);
}
\`\`\`

## Required Fields

Communicate required fields clearly:

\`\`\`tsx
<label htmlFor="name">
  Full name
  <span aria-hidden="true" className="required">*</span>
  <span className="sr-only">(required)</span>
</label>
<input
  id="name"
  required
  aria-required="true"
/>
\`\`\`

## Form Submission Feedback

Communicate success and loading states:

\`\`\`tsx
function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      <button
        type="submit"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
      >
        {status === "loading" ? "Sending..." : "Send message"}
      </button>

      {status === "success" && (
        <p role="status" aria-live="polite">
          Message sent successfully!
        </p>
      )}
    </form>
  );
}
\`\`\`

## Grouping Related Fields

Use fieldset and legend for related inputs:

\`\`\`tsx
<fieldset>
  <legend>Shipping address</legend>

  <FormField label="Street address" name="street" />
  <FormField label="City" name="city" />
  <FormField label="Postal code" name="postal" />
</fieldset>
\`\`\`

## Testing Accessibility

- Use keyboard-only navigation
- Test with screen readers (VoiceOver, NVDA)
- Run axe DevTools audits
- Check colour contrast ratios

## Conclusion

Accessible forms aren't just about compliance—they're better forms for everyone. Clear labels, proper error handling, and logical navigation improve the experience for all users.`,
  },
  {
    slug: "modern-css-techniques",
    title: "Modern CSS Techniques for Responsive Design",
    summary:
      "Leverage container queries, CSS Grid, and logical properties to build truly responsive layouts without JavaScript.",
    tags: ["CSS", "Web Development", "Responsive Design"],
    featured: false,
    status: "published" as const,
    publishedAt: new Date("2024-04-22"),
    content: `# Modern CSS Techniques for Responsive Design

CSS has evolved dramatically. These modern techniques let you build responsive layouts that were previously impossible or required JavaScript.

## Container Queries

Style elements based on their container, not just the viewport:

\`\`\`css
.card-container {
  container-type: inline-size;
  container-name: card;
}

.card {
  display: grid;
  gap: 1rem;
}

@container card (min-width: 400px) {
  .card {
    grid-template-columns: 200px 1fr;
  }
}

@container card (min-width: 600px) {
  .card {
    grid-template-columns: 250px 1fr 100px;
  }
}
\`\`\`

This is revolutionary for component libraries—cards adapt to their context, not the screen size.

## CSS Grid for Complex Layouts

Master the implicit and explicit grid:

\`\`\`css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.dashboard-item.featured {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .dashboard-item.featured {
    grid-column: span 1;
  }
}
\`\`\`

## Logical Properties

Write direction-agnostic CSS:

\`\`\`css
/* Instead of */
.element {
  margin-left: 1rem;
  padding-right: 2rem;
  border-top: 1px solid;
}

/* Use logical properties */
.element {
  margin-inline-start: 1rem;
  padding-inline-end: 2rem;
  border-block-start: 1px solid;
}
\`\`\`

This works correctly for RTL languages without any changes.

## The :has() Selector

Style parents based on children:

\`\`\`css
/* Card with image gets different layout */
.card:has(img) {
  grid-template-rows: 200px 1fr;
}

/* Form field with error */
.field:has(input:invalid) {
  --border-color: var(--error);
}

/* Navigation with active link */
nav:has(.active) .logo {
  color: var(--primary);
}
\`\`\`

## Clamp for Fluid Typography

Responsive font sizes without media queries:

\`\`\`css
h1 {
  /* Min: 2rem, Preferred: 5vw, Max: 4rem */
  font-size: clamp(2rem, 5vw, 4rem);
}

p {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
}
\`\`\`

## View Transitions API

Smooth page transitions with CSS:

\`\`\`css
@view-transition {
  navigation: auto;
}

::view-transition-old(root) {
  animation: fade-out 0.2s ease-out;
}

::view-transition-new(root) {
  animation: fade-in 0.3s ease-in;
}

/* Named transitions for specific elements */
.hero-image {
  view-transition-name: hero;
}
\`\`\`

## Subgrid

Align nested grids to parent tracks:

\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.grid-item {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
\`\`\`

## Conclusion

Modern CSS eliminates much of the complexity we used to handle with JavaScript. Container queries, :has(), and logical properties make truly responsive, adaptable components possible with pure CSS.`,
  },
  {
    slug: "debugging-production-issues",
    title: "Debugging Production Issues Like a Pro",
    summary:
      "Systematic approaches to debugging production problems, from log analysis to distributed tracing and post-mortems.",
    tags: ["Debugging", "DevOps", "Best Practices"],
    featured: false,
    status: "draft" as const,
    publishedAt: null,
    content: `# Debugging Production Issues Like a Pro

Production bugs are inevitable. Having a systematic approach to debugging makes the difference between hours of frustration and a quick resolution.

## The Debugging Mindset

1. **Stay calm** - Panic leads to poor decisions
2. **Gather information** - Don't jump to conclusions
3. **Reproduce if possible** - Understanding the trigger is half the battle
4. **Make one change at a time** - Otherwise you won't know what fixed it

## Structured Logging

Good logs are your first line of defence:

\`\`\`typescript
import { logger } from "@/lib/logger";

export async function processPayment(orderId: string) {
  const context = { orderId, service: "payments" };

  logger.info("Payment processing started", context);

  try {
    const result = await paymentGateway.charge(order);
    logger.info("Payment successful", { ...context, transactionId: result.id });
    return result;
  } catch (error) {
    logger.error("Payment failed", {
      ...context,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
\`\`\`

## Log Analysis

Search patterns for common issues:

\`\`\`bash
# Find errors in the last hour
grep -E "ERROR|error|Error" logs/app.log | tail -100

# Correlate by request ID
grep "req_abc123" logs/app.log

# Count error types
grep "ERROR" logs/app.log | cut -d'"' -f4 | sort | uniq -c | sort -rn
\`\`\`

## Distributed Tracing

For microservices, traces are essential:

\`\`\`typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-service");

export async function handleRequest(req: Request) {
  return tracer.startActiveSpan("handleRequest", async (span) => {
    span.setAttribute("http.method", req.method);
    span.setAttribute("http.url", req.url);

    try {
      const result = await processRequest(req);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
\`\`\`

## Debugging Checklist

When an issue occurs:

1. **What changed?** - Recent deployments, config changes, traffic spikes
2. **What's the impact?** - All users or specific segment?
3. **Can you reproduce?** - Locally, staging, or only production?
4. **What do the metrics show?** - Error rates, latency, resource usage

## The Five Whys

Dig into root causes:

- **Why** did the payment fail? Gateway timeout
- **Why** did it timeout? Database query took 30s
- **Why** was it slow? Missing index
- **Why** was the index missing? Migration failed silently
- **Why** did it fail silently? No migration status monitoring

## Post-Mortems

Document learnings without blame:

\`\`\`markdown
## Incident: Payment Processing Outage

**Duration**: 45 minutes
**Impact**: ~200 failed transactions

### Timeline
- 14:00 - Deploy v2.3.1
- 14:15 - Error rate increases
- 14:30 - Incident declared
- 14:45 - Rollback completed

### Root Cause
Missing database index caused slow queries under load.

### Action Items
- [ ] Add query timeout alerts
- [ ] Require index review for schema changes
- [ ] Add synthetic transaction monitoring
\`\`\`

## Conclusion

Effective debugging is systematic, not heroic. Build observability into your systems, practice structured approaches, and learn from every incident.`,
  },
  {
    slug: "monitoring-application-health",
    title: "Monitoring Application Health in Real-Time",
    summary:
      "Set up comprehensive monitoring with metrics, alerts, and dashboards to catch issues before your users do.",
    tags: ["Monitoring", "DevOps", "Observability"],
    featured: false,
    status: "draft" as const,
    publishedAt: null,
    content: `# Monitoring Application Health in Real-Time

You can't fix what you can't see. Effective monitoring gives you visibility into application health before users report problems.

## The Four Golden Signals

Focus on these key metrics:

1. **Latency** - How long requests take
2. **Traffic** - Request volume
3. **Errors** - Error rate and types
4. **Saturation** - Resource utilisation

## Implementing Health Checks

Create meaningful health endpoints:

\`\`\`typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalApi(),
  ]);

  const health = {
    status: checks.every((c) => c.status === "fulfilled") ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      database: formatCheck(checks[0]),
      redis: formatCheck(checks[1]),
      externalApi: formatCheck(checks[2]),
    },
  };

  const status = health.status === "healthy" ? 200 : 503;
  return Response.json(health, { status });
}

async function checkDatabase() {
  const start = Date.now();
  await db.execute(sql\`SELECT 1\`);
  return { latency: Date.now() - start };
}
\`\`\`

## Custom Metrics

Track business-specific metrics:

\`\`\`typescript
import { metrics } from "@/lib/metrics";

export async function createOrder(data: OrderData) {
  const timer = metrics.startTimer("order_creation_duration");

  try {
    const order = await db.insert(orders).values(data);

    metrics.increment("orders_created_total", {
      status: "success",
      type: data.type,
    });

    return order;
  } catch (error) {
    metrics.increment("orders_created_total", {
      status: "failed",
      error: error.code,
    });
    throw error;
  } finally {
    timer.end();
  }
}
\`\`\`

## Alerting Strategy

Alert on symptoms, not causes:

\`\`\`yaml
# Good: Alert on user impact
- alert: HighErrorRate
  expr: rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 2m
  annotations:
    summary: "Error rate above 5%"

# Less useful: Alert on potential cause
- alert: HighCPU
  expr: cpu_usage > 80
  # CPU can be high without impacting users
\`\`\`

## Dashboard Design

Create dashboards that tell a story:

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                     Service Overview                      │
├─────────────────┬─────────────────┬─────────────────────┤
│   Request Rate  │   Error Rate    │   P99 Latency       │
│   ████████████  │   ░░░░░░░░░░░░  │   ████░░░░░░░░      │
│   2.5k req/s    │   0.1%          │   245ms             │
├─────────────────┴─────────────────┴─────────────────────┤
│                  Latency Distribution                     │
│   p50: 45ms  p90: 120ms  p95: 180ms  p99: 245ms         │
├─────────────────────────────────────────────────────────┤
│                    Recent Errors                          │
│   14:32:15  DatabaseTimeout  /api/posts  3 occurrences  │
│   14:28:42  ValidationError  /api/users  1 occurrence   │
└─────────────────────────────────────────────────────────┘
\`\`\`

## Synthetic Monitoring

Proactively check critical paths:

\`\`\`typescript
// Run every minute
export async function syntheticCheck() {
  const checks = [
    {
      name: "homepage",
      url: "https://example.com",
      expectedStatus: 200,
    },
    {
      name: "api_health",
      url: "https://example.com/api/health",
      expectedStatus: 200,
    },
  ];

  for (const check of checks) {
    const start = Date.now();
    const response = await fetch(check.url);
    const duration = Date.now() - start;

    metrics.gauge("synthetic_check_duration", duration, { name: check.name });
    metrics.gauge("synthetic_check_status", response.status === check.expectedStatus ? 1 : 0, {
      name: check.name,
    });
  }
}
\`\`\`

## Conclusion

Good monitoring is an investment that pays off when things go wrong. Start with the golden signals, add business metrics, and set up alerts that wake you up only when users are affected.`,
  },
];

const main = async () => {
  console.log("🌱 Starting database seeding...\n");

  checkEnvironment();

  try {
    // Clear existing data from all tables
    console.log("🗑️  Resetting database (clearing all tables)...");
    await reset(db, schema);
    console.log("✅ Database reset complete\n");

    // Create a seed user for post authorship
    console.log("👤 Creating seed user...");
    const [seedUser] = await db
      .insert(user)
      .values({
        id: "seed-user-dev",
        name: "Ru Chern Chong",
        email: "hello@ruchern.dev",
        emailVerified: true,
        image: null,
      })
      .returning();
    console.log(`✅ Created seed user: ${seedUser.name} (${seedUser.email})\n`);

    // Insert sample posts with realistic content
    console.log("📝 Inserting sample posts with developer content...\n");

    for (const post of samplePosts) {
      const metadata = generateMetadata(
        post.title,
        post.summary,
        post.slug,
        post.content,
      );

      await db.insert(posts).values({
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        content: post.content,
        status: post.status,
        tags: post.tags,
        featured: post.featured,
        authorId: seedUser.id,
        publishedAt: post.publishedAt,
        metadata,
      });

      console.log(`   ✓ ${post.title}`);
    }

    console.log("\n✅ Successfully seeded all posts!\n");

    // Add sample Mermaid diagram post
    console.log("📊 Adding sample Mermaid diagram post...\n");
    const mermaidContent = `# Visualising System Architecture with Mermaid Diagrams

Mermaid is a powerful diagramming tool that lets you create diagrams using simple text syntax. This post demonstrates various diagram types you can embed directly in MDX.

## Sequence Diagrams

Sequence diagrams are perfect for illustrating how components interact over time:

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API
    participant Database

    User->>Browser: Click "Submit"
    Browser->>API: POST /api/posts
    API->>Database: INSERT INTO posts
    Database-->>API: Success
    API-->>Browser: 201 Created
    Browser-->>User: Show success message
\`\`\`

## Flowcharts

Flowcharts help visualise decision processes and workflows:

\`\`\`mermaid
flowchart TD
    A[Start] --> B{Is user authenticated?}
    B -->|Yes| C[Show dashboard]
    B -->|No| D[Redirect to login]
    D --> E[User enters credentials]
    E --> F{Valid credentials?}
    F -->|Yes| C
    F -->|No| G[Show error]
    G --> E
\`\`\`

## Entity Relationship Diagrams

ER diagrams are useful for documenting database schemas:

\`\`\`mermaid
erDiagram
    USER ||--o{ POST : writes
    USER {
        string id PK
        string name
        string email
    }
    POST ||--|{ TAG : has
    POST {
        uuid id PK
        string title
        text content
        string status
    }
    TAG {
        string name PK
    }
\`\`\`

## State Diagrams

State diagrams show the different states an entity can be in:

\`\`\`mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Published: publish()
    Published --> Draft: unpublish()
    Draft --> Deleted: delete()
    Published --> Deleted: delete()
    Deleted --> Draft: restore()
    Deleted --> [*]: permanentDelete()
\`\`\`

## Conclusion

Mermaid diagrams are a fantastic way to add visual documentation to your technical blog posts without needing external tools or image files.`;

    const mermaidSummary =
      "A demonstration of embedding Mermaid diagrams in MDX blog posts, including sequence diagrams, flowcharts, and entity relationship diagrams.";
    const mermaidSlug = "mermaid-diagrams-demo";
    const mermaidTitle =
      "Visualising System Architecture with Mermaid Diagrams";

    await db.insert(posts).values({
      slug: mermaidSlug,
      title: mermaidTitle,
      summary: mermaidSummary,
      content: mermaidContent,
      status: "published",
      tags: ["MDX", "Mermaid", "Documentation", "Tutorial"],
      featured: true,
      authorId: seedUser.id,
      publishedAt: new Date(),
      metadata: generateMetadata(
        mermaidTitle,
        mermaidSummary,
        mermaidSlug,
        mermaidContent,
      ),
    });

    console.log(`   ✓ ${mermaidTitle}\n`);

    // Display summary
    const allPosts = [...samplePosts, { status: "published", featured: true }];
    const published = allPosts.filter((p) => p.status === "published").length;
    const draft = allPosts.filter((p) => p.status === "draft").length;
    const featured = allPosts.filter((p) => p.featured).length;

    console.log(`📊 Seeding Summary:`);
    console.log(`   Seed user: ${seedUser.name} (${seedUser.email})`);
    console.log(`   Total posts: ${allPosts.length}`);
    console.log(`   - Published: ${published}`);
    console.log(`   - Draft: ${draft}`);
    console.log(`   - Featured: ${featured}`);
    console.log(`   - All posts authored by: ${seedUser.name}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run the seed function
main();
