import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generatePostMetadata } from "@/lib/post-metadata";
import { db, type InsertPost, posts } from "@/schema";

export const GET = async () => {
  try {
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.updatedAt));

    return NextResponse.json(allPosts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { message: "Failed to fetch posts" },
      { status: 500 },
    );
  }
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { title, slug, summary, content, status, tags, coverImage } = body;

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        { message: "Title, slug, and content are required" },
        { status: 400 },
      );
    }

    // Generate metadata
    const publishedAt = status === "published" ? new Date() : null;
    const metadata = generatePostMetadata(
      title,
      slug,
      content,
      summary,
      publishedAt,
    );

    // Create post
    const newPost: InsertPost = {
      title,
      slug,
      summary: summary || null,
      content,
      status: status || "draft",
      tags: tags || [],
      coverImage: coverImage || null,
      metadata,
      publishedAt,
    };

    const [createdPost] = await db.insert(posts).values(newPost).returning();

    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { message: "Failed to create post" },
      { status: 500 },
    );
  }
};
