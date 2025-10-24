import "dotenv/config";
import { eq } from "drizzle-orm";
import { reset, seed } from "drizzle-seed";
import readingTime from "reading-time";
import * as schema from "@/schema";
import { db, type PostMetadata, posts } from "@/schema";

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
  const siteUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const postUrl = `${siteUrl}/blog/${slug}`;
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
      images: [`${siteUrl}/api/og?title=${encodeURIComponent(title)}`],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: "@ruchernchong",
      title,
      description: summary,
      images: [`${siteUrl}/api/og?title=${encodeURIComponent(title)}`],
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      dateModified: now,
      datePublished: now,
      description: summary,
      image: [`${siteUrl}/api/og?title=${encodeURIComponent(title)}`],
      url: postUrl,
      author: {
        "@type": "Person",
        name: "Ru Chern Chong",
        url: siteUrl,
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
              const numTags = Math.floor(Math.random() * 3) + 2; // 2-4 tags
              const shuffled = [...availableTags].sort(
                () => Math.random() - 0.5,
              );
              return shuffled.slice(0, numTags);
            })(),
          }),
          featured: f.boolean(),
          publishedAt: f.date({
            minDate: "2024-01-01",
            maxDate: "2024-12-31",
          }),
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

    // Display summary
    const published = allPosts.filter((p) => p.status === "published").length;
    const draft = allPosts.filter((p) => p.status === "draft").length;
    const featured = allPosts.filter((p) => p.featured).length;

    console.log(`📊 Seeding Summary:`);
    console.log(`   Total posts: ${allPosts.length}`);
    console.log(`   - Published: ${published}`);
    console.log(`   - Draft: ${draft}`);
    console.log(`   - Featured: ${featured}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run the seed function
main();
