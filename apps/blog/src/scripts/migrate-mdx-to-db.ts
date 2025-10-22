import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import matter from "gray-matter";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { generatePostMetadata } from "@/lib/post-metadata";
import { db, type InsertPost, posts } from "@/schema";

// Parse command line arguments
const args = process.argv.slice(2);
const isProductionMode = args.includes("--production");
const isDryRun = args.includes("--dry-run");
const skipConfirmation = args.includes("--skip-confirmation");

// Safety check: Allow production with explicit flag
const checkEnvironment = () => {
  const databaseUrl = process.env.DATABASE_URL || "";
  const productionDomains = ["vercel", "production", "prod"];
  const isProduction =
    process.env.NODE_ENV === "production" ||
    productionDomains.some((domain) =>
      databaseUrl.toLowerCase().includes(domain),
    );

  if (isProduction && !isProductionMode) {
    console.error("❌ ERROR: This appears to be a production environment!");
    console.error(
      "   To run migration in production, use: pnpm migrate-mdx:prod",
    );
    console.error("   To preview changes, use: pnpm migrate-mdx:dry-run");
    process.exit(1);
  }

  if (isProductionMode && !isProduction) {
    console.warn(
      "⚠️  WARNING: --production flag used but not in production environment",
    );
  }

  if (isProductionMode) {
    console.log("🚨 PRODUCTION MODE ENABLED");
  } else {
    console.log("✅ Development mode");
  }

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No database changes will be made\n");
  } else {
    console.log("");
  }
};

interface MDXFrontmatter {
  title: string;
  publishedAt: string | Date;
  excerpt: string;
  featured?: boolean;
  isDraft?: boolean;
  image?: string;
}

// Extract slug from filename (e.g., "how-i-built-my-blog.mdx" → "how-i-built-my-blog")
const getSlugFromFilename = (filename: string): string => {
  return path.basename(filename, ".mdx");
};

// Parse a single MDX file
const parseMDXFile = async (
  filePath: string,
): Promise<{ frontmatter: MDXFrontmatter; content: string; slug: string }> => {
  const fileContent = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  // Validate required fields
  if (!data.title) {
    throw new Error(`Missing required field 'title' in ${filePath}`);
  }
  if (!data.publishedAt) {
    throw new Error(`Missing required field 'publishedAt' in ${filePath}`);
  }
  if (!data.excerpt) {
    throw new Error(`Missing required field 'excerpt' in ${filePath}`);
  }

  const slug = getSlugFromFilename(filePath);

  return {
    frontmatter: data as MDXFrontmatter,
    content: content.trim(),
    slug,
  };
};

// Transform MDX data to database post format
const transformToPost = (
  frontmatter: MDXFrontmatter,
  content: string,
  slug: string,
): InsertPost => {
  // Determine status from isDraft field
  const status = frontmatter.isDraft === true ? "draft" : "published";

  // Parse publishedAt date
  const publishedAt =
    status === "published" ? new Date(frontmatter.publishedAt) : null;

  // Generate metadata
  const metadata = generatePostMetadata(
    frontmatter.title,
    slug,
    content,
    frontmatter.excerpt,
    publishedAt,
  );

  return {
    slug,
    title: frontmatter.title,
    summary: frontmatter.excerpt,
    content,
    status,
    tags: [], // No tags in frontmatter, initialize as empty
    featured: frontmatter.featured ?? false,
    coverImage: frontmatter.image ?? null,
    publishedAt,
    metadata,
  };
};

// Main migration function
const main = async () => {
  console.log("📦 MDX to Database Migration Script\n");
  console.log(
    "This script will migrate MDX files from content/blog/ to the database.\n",
  );

  // Safety checks
  checkEnvironment();

  // Get confirmation from user (unless skip flag is set)
  if (!skipConfirmation) {
    const rl = readline.createInterface({ input, output });
    const confirmMessage = isDryRun
      ? "⚠️  Run dry-run to preview migration? (yes/no): "
      : "⚠️  This will insert posts into the database. Continue? (yes/no): ";
    const answer = await rl.question(confirmMessage);
    rl.close();

    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Migration cancelled.");
      process.exit(0);
    }
  } else {
    console.log("⏭️  Skipping confirmation (--skip-confirmation flag set)");
  }

  console.log(
    `\n🚀 Starting ${isDryRun ? "dry-run" : "migration"}...\n`,
  );

  try {
    // Read all MDX files from content/blog directory
    const contentDir = path.join(process.cwd(), "content", "blog");
    console.log(`📂 Reading MDX files from: ${contentDir}`);

    const files = await fs.readdir(contentDir);
    const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

    console.log(`✅ Found ${mdxFiles.length} MDX files\n`);

    if (mdxFiles.length === 0) {
      console.log("⚠️  No MDX files found. Exiting.");
      process.exit(0);
    }

    // Parse all MDX files
    console.log("📝 Parsing MDX files...\n");
    const parsedFiles: Array<{
      filename: string;
      post: InsertPost;
    }> = [];

    for (const file of mdxFiles) {
      const filePath = path.join(contentDir, file);
      try {
        const { frontmatter, content, slug } = await parseMDXFile(filePath);
        const post = transformToPost(frontmatter, content, slug);

        parsedFiles.push({ filename: file, post });
        console.log(`   ✓ ${file} → ${slug}`);
      } catch (error) {
        console.error(`   ✗ ${file}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    console.log(`\n✅ Successfully parsed ${parsedFiles.length}/${mdxFiles.length} files\n`);

    if (parsedFiles.length === 0) {
      console.log("❌ No files to migrate. Exiting.");
      process.exit(1);
    }

    // Check for existing posts with same slugs
    console.log("🔍 Checking for existing posts...\n");
    const existingPosts = await db.select().from(posts);
    const existingSlugs = new Set(existingPosts.map((p) => p.slug));

    const conflicts = parsedFiles.filter((pf) => existingSlugs.has(pf.post.slug));

    if (conflicts.length > 0) {
      console.log("⚠️  Warning: Found posts with conflicting slugs:");
      for (const conflict of conflicts) {
        console.log(`   - ${conflict.post.slug}`);
      }
      console.log("\nThese posts will be SKIPPED to avoid duplicates.\n");
    }

    // Filter out conflicts
    const postsToInsert = parsedFiles.filter((pf) => !existingSlugs.has(pf.post.slug));

    if (postsToInsert.length === 0) {
      console.log("ℹ️  All posts already exist in database. Nothing to migrate.");
      process.exit(0);
    }

    // Insert posts into database (or simulate in dry-run mode)
    if (isDryRun) {
      console.log(
        `🔍 DRY RUN: Would insert ${postsToInsert.length} posts into database...\n`,
      );

      let successCount = 0;

      for (const { post } of postsToInsert) {
        console.log(
          `   ✓ Would insert: ${post.slug} (${post.status})${post.featured ? " ⭐" : ""}`,
        );
        successCount++;
      }

      // Display dry-run summary
      console.log("\n" + "=".repeat(60));
      console.log("🔍 DRY RUN Summary:");
      console.log("=".repeat(60));
      console.log(`Total MDX files found:     ${mdxFiles.length}`);
      console.log(`Successfully parsed:       ${parsedFiles.length}`);
      console.log(`Would skip (conflicts):    ${conflicts.length}`);
      console.log(`Would insert:              ${successCount}`);
      console.log("=".repeat(60));

      console.log("\n✅ Dry run completed successfully!");
      console.log(
        "\n💡 To run actual migration, use: pnpm migrate-mdx:prod (without --dry-run)",
      );
    } else {
      console.log(
        `📥 Inserting ${postsToInsert.length} posts into database...\n`,
      );

      let successCount = 0;
      let errorCount = 0;

      for (const { filename, post } of postsToInsert) {
        try {
          await db.insert(posts).values(post);
          console.log(`   ✓ Inserted: ${post.slug} (${post.status})`);
          successCount++;
        } catch (error) {
          console.error(
            `   ✗ Failed to insert ${filename}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          errorCount++;
        }
      }

      // Display summary
      console.log("\n" + "=".repeat(60));
      console.log("📊 Migration Summary:");
      console.log("=".repeat(60));
      console.log(`Total MDX files found:     ${mdxFiles.length}`);
      console.log(`Successfully parsed:       ${parsedFiles.length}`);
      console.log(`Skipped (conflicts):       ${conflicts.length}`);
      console.log(`Successfully inserted:     ${successCount}`);
      console.log(`Failed to insert:          ${errorCount}`);
      console.log("=".repeat(60));

      if (successCount > 0) {
        console.log("\n✅ Migration completed successfully!");
        console.log(
          `\n💡 Tip: Run 'pnpm studio' to view your migrated posts in Drizzle Studio`,
        );
      }

      process.exit(errorCount > 0 ? 1 : 0);
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration
main();
