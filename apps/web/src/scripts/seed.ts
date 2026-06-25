import "dotenv/config";
import { reset } from "drizzle-seed";
import readingTime from "reading-time";
import * as schema from "@/schema";
import { db, type PostMetadata, posts, user } from "@/schema";

type SeedPost = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  featured: boolean;
  status: "draft" | "published";
  publishedAt: Date;
  sections: string[];
};

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

const generateMetadata = (
  title: string,
  summary: string,
  slug: string,
  content: string,
): PostMetadata => {
  const { text: readingTimeText } = readingTime(content);
  const postUrl = `/blog/${slug}`;
  const now = new Date().toISOString();
  const ogImage = `/api/og?title=${encodeURIComponent(title)}`;

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
      images: [ogImage],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: "@ruchernchong",
      title,
      description: summary,
      images: [ogImage],
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      dateModified: now,
      datePublished: now,
      description: summary,
      image: [ogImage],
      url: postUrl,
      author: {
        "@type": "Person",
        name: "Ru Chern Chong",
        url: "/",
      },
    },
  };
};

const createContent = ({ sections }: SeedPost) => {
  const body = sections
    .map(
      (section) => `## ${section}

This seed post gives the local Studio enough realistic MDX content to exercise rendering, metadata, tags, and related-post behaviour during development. Replace it with production content through the CMS instead of editing the seed script.

- Validate the data flow in the editor and preview routes.
- Keep the example concise so static analysis does not treat fixture text as duplicated code.
- Use this as a stable baseline when resetting a development database.`,
    )
    .join("\n\n");

  // Title and summary are rendered by the page chrome, not the MDX body, so the
  // seed body starts at the first section (matching Studio-authored content).
  return `${body}

## Conclusion

This generated seed article exists to support local development. It intentionally avoids long copied examples so quality tools focus on application code.`;
};

const samplePosts: SeedPost[] = [
  {
    slug: "advanced-typescript-patterns",
    title: "Advanced TypeScript Patterns for Production",
    summary:
      "Explore discriminated unions, branded types, and builder-style APIs for maintainable TypeScript code.",
    tags: ["TypeScript", "Web Development", "Best Practices"],
    featured: true,
    status: "published",
    publishedAt: new Date("2024-11-15"),
    sections: ["Type Modelling", "Safer Boundaries", "Production Tradeoffs"],
  },
  {
    slug: "nextjs-app-router-best-practices",
    title: "Next.js App Router: Best Practices Guide",
    summary:
      "A practical guide to server components, caching, data loading, and routing decisions in the App Router.",
    tags: ["Next.js", "React", "Web Development"],
    featured: true,
    status: "published",
    publishedAt: new Date("2024-10-28"),
    sections: ["Server Components", "Caching Boundaries", "Client Islands"],
  },
  {
    slug: "testing-strategies-react",
    title: "Testing Strategies for React Applications",
    summary:
      "How to choose between unit, integration, and end-to-end tests for React applications.",
    tags: ["React", "Testing", "Quality"],
    featured: false,
    status: "published",
    publishedAt: new Date("2024-10-12"),
    sections: ["Testing Pyramid", "User Behaviour", "Mocking Boundaries"],
  },
  {
    slug: "optimizing-web-vitals",
    title: "Optimising Core Web Vitals in Production",
    summary:
      "Practical techniques for improving LCP, CLS, and INP in a production web application.",
    tags: ["Performance", "Web Vitals", "Frontend"],
    featured: false,
    status: "published",
    publishedAt: new Date("2024-09-22"),
    sections: ["Measure First", "Rendering Work", "Image Delivery"],
  },
  {
    slug: "database-performance-tips",
    title: "Database Performance Tips for Web Apps",
    summary:
      "Indexing, query shape, and connection patterns that keep database-backed applications responsive.",
    tags: ["Database", "PostgreSQL", "Performance"],
    featured: false,
    status: "published",
    publishedAt: new Date("2024-09-05"),
    sections: ["Query Shape", "Index Design", "Connection Management"],
  },
  {
    slug: "api-security-essentials",
    title: "API Security Essentials",
    summary:
      "A concise checklist for authentication, authorisation, validation, and audit logging in web APIs.",
    tags: ["Security", "API", "Backend"],
    featured: false,
    status: "published",
    publishedAt: new Date("2024-08-18"),
    sections: ["Authentication", "Input Validation", "Audit Trails"],
  },
  {
    slug: "accessible-web-forms",
    title: "Building Accessible Web Forms",
    summary:
      "Form patterns that improve keyboard navigation, labels, validation feedback, and screen reader output.",
    tags: ["Accessibility", "Forms", "Frontend"],
    featured: false,
    status: "published",
    publishedAt: new Date("2024-08-02"),
    sections: ["Labels", "Validation", "Keyboard Flow"],
  },
  {
    slug: "modern-css-techniques",
    title: "Modern CSS Techniques Worth Using",
    summary:
      "Container queries, cascade layers, logical properties, and modern layout techniques for product UIs.",
    tags: ["CSS", "Frontend", "Design Systems"],
    featured: false,
    status: "published",
    publishedAt: new Date("2024-07-19"),
    sections: ["Responsive Components", "Cascade Control", "Layout Systems"],
  },
  {
    slug: "debugging-production-issues",
    title: "Debugging Production Issues Without Guesswork",
    summary:
      "A repeatable approach to logs, traces, metrics, and rollback decisions during incidents.",
    tags: ["Debugging", "Production", "Observability"],
    featured: false,
    status: "published",
    publishedAt: new Date("2024-07-03"),
    sections: ["Triage", "Signals", "Follow-Up"],
  },
  {
    slug: "monitoring-application-health",
    title: "Monitoring Application Health",
    summary:
      "What to measure when monitoring application health, user impact, and operational risk.",
    tags: ["Monitoring", "Observability", "DevOps"],
    featured: true,
    status: "published",
    publishedAt: new Date("2024-06-20"),
    sections: ["Golden Signals", "Business Metrics", "Alert Quality"],
  },
  {
    slug: "mermaid-diagrams-demo",
    title: "Visualising System Architecture with Mermaid Diagrams",
    summary:
      "A demonstration of Mermaid diagrams in MDX posts for local rendering checks.",
    tags: ["MDX", "Mermaid", "Documentation", "Tutorial"],
    featured: true,
    status: "published",
    publishedAt: new Date("2024-06-01"),
    sections: ["Sequence Diagrams", "Flowcharts", "Entity Relationships"],
  },
];

const main = async () => {
  console.log("🌱 Starting database seeding...\n");

  checkEnvironment();

  try {
    console.log("🗑️  Resetting database (clearing all tables)...");
    await reset(db, schema);
    console.log("✅ Database reset complete\n");

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

    console.log("📝 Inserting sample posts with developer content...\n");

    for (const post of samplePosts) {
      const content = createContent(post);

      await db.insert(posts).values({
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        content,
        status: post.status,
        tags: post.tags,
        featured: post.featured,
        authorId: seedUser.id,
        publishedAt: post.publishedAt,
        metadata: generateMetadata(
          post.title,
          post.summary,
          post.slug,
          content,
        ),
      });

      console.log(`   ✓ ${post.title}`);
    }

    const published = samplePosts.filter(
      (post) => post.status === "published",
    ).length;
    const draft = samplePosts.filter((post) => post.status === "draft").length;
    const featured = samplePosts.filter((post) => post.featured).length;

    console.log("\n✅ Successfully seeded all posts!\n");
    console.log("📊 Seeding Summary:");
    console.log(`   Seed user: ${seedUser.name} (${seedUser.email})`);
    console.log(`   Total posts: ${samplePosts.length}`);
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

main();
