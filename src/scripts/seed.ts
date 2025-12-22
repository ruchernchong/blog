import "dotenv/config";
import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { reset, seed } from "drizzle-seed";
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

const main = async () => {
  console.log("🌱 Starting database seeding with Drizzle Seed...\n");

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

    // Seed the database with generated data
    console.log("📝 Generating and inserting sample posts...\n");

    const availableTags = [
      "Next.js",
      "TypeScript",
      "React",
      "Testing",
      "Performance",
      "Security",
      "Web Development",
      "Database",
      "API",
      "UX",
      "Accessibility",
    ];

    await seed(db, { posts }, { count: 10 }).refine((f) => ({
      posts: {
        columns: {
          slug: f.valuesFromArray({
            values: [
              "advanced-typescript-patterns",
              "nextjs-app-router-best-practices",
              "testing-strategies-react",
              "optimizing-web-vitals",
              "database-performance-tips",
              "api-security-essentials",
              "accessible-web-forms",
              "modern-css-techniques",
              "debugging-production-issues",
              "monitoring-application-health",
            ],
          }),
          title: f.valuesFromArray({
            values: [
              "Advanced TypeScript Patterns for Production",
              "Next.js App Router: Best Practices Guide",
              "Testing Strategies for React Applications",
              "Optimizing Core Web Vitals for Better UX",
              "Database Performance Optimization Tips",
              "API Security Essentials Every Developer Should Know",
              "Building Accessible Web Forms",
              "Modern CSS Techniques for Responsive Design",
              "Debugging Production Issues Like a Pro",
              "Monitoring Application Health in Real-Time",
            ],
          }),
          summary: f.loremIpsum({ sentencesCount: 2 }),
          content: f.loremIpsum({ sentencesCount: 100 }),
          status: f.weightedRandom([
            { weight: 0.7, value: f.default({ defaultValue: "published" }) },
            { weight: 0.3, value: f.default({ defaultValue: "draft" }) },
          ]),
          tags: f.default({
            defaultValue: (() => {
              // Randomly select 2-4 tags
              const numTags = randomInt(2, 5); // 2-4 tags
              // Fisher-Yates shuffle using crypto.randomInt
              const shuffled = [...availableTags];
              for (let i = shuffled.length - 1; i > 0; i--) {
                const j = randomInt(0, i + 1);
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
              }
              return shuffled.slice(0, numTags);
            })(),
          }),
          featured: f.boolean(),
          authorId: f.default({ defaultValue: seedUser.id }),
          publishedAt: f.date({
            minDate: "2024-01-01",
            maxDate: "2024-12-31",
          }),
          deletedAt: f.default({ defaultValue: null }),
          metadata: f.default({
            defaultValue: generateMetadata(
              "Placeholder Title",
              "Placeholder summary",
              "placeholder-slug",
              "Placeholder content",
            ),
          }),
        },
      },
    }));

    console.log("✅ Successfully seeded initial data!\n");

    // Update metadata for all posts with actual values
    console.log("📝 Updating metadata with actual post data...\n");
    const allPosts = await db.select().from(posts);

    for (const post of allPosts) {
      const metadata = generateMetadata(
        post.title,
        post.summary || "",
        post.slug,
        post.content,
      );

      await db.update(posts).set({ metadata }).where(eq(posts.id, post.id));
    }

    console.log("✅ Successfully updated all metadata!\n");

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

    console.log("✅ Added Mermaid diagram sample post!\n");

    // Display summary
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
