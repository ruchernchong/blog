import "dotenv/config";
import { db, posts } from "@/schema";
import { desc } from "drizzle-orm";

const verify = async () => {
  const allPosts = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      status: posts.status,
      featured: posts.featured,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .orderBy(desc(posts.publishedAt));

  console.log("\n📊 Database Posts Summary:");
  console.log("=".repeat(80));
  console.log(`Total posts: ${allPosts.length}`);
  console.log(
    `Published: ${allPosts.filter((p) => p.status === "published").length}`,
  );
  console.log(`Draft: ${allPosts.filter((p) => p.status === "draft").length}`);
  console.log(`Featured: ${allPosts.filter((p) => p.featured).length}`);
  console.log("=".repeat(80));
  console.log("\nRecent posts:");
  allPosts.slice(0, 5).forEach((post, i) => {
    const publishDate = post.publishedAt
      ? post.publishedAt.toISOString().split("T")[0]
      : "N/A";
    console.log(`${i + 1}. [${post.status}] ${post.title}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Published: ${publishDate}${post.featured ? " ⭐" : ""}\n`);
  });
};

verify()
  .then(() => process.exit(0))
  .catch(console.error);
