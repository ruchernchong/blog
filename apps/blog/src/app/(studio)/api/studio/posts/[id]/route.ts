import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generatePostMetadata } from "@/lib/post-metadata";
import { db, posts } from "@/schema";

export const GET = async ({
  params,
}: {
  params: Promise<Record<string, string>>;
}) => {
  const postId = (await params).id;

  if (!postId) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return NextResponse.json(
      { message: "Failed to fetch post" },
      { status: 500 },
    );
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<Record<string, string>> },
) => {
  const postId = (await params).id;

  if (!postId) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

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

    // Get existing post to check if it exists
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Determine publishedAt
    let publishedAt = existingPost.publishedAt;
    if (status === "published" && !existingPost.publishedAt) {
      publishedAt = new Date();
    } else if (status === "draft") {
      publishedAt = null;
    }

    // Generate updated metadata
    const metadata = generatePostMetadata(
      title,
      slug,
      content,
      summary,
      publishedAt,
    );

    // Update post
    const [updatedPost] = await db
      .update(posts)
      .set({
        title,
        slug,
        summary: summary || null,
        content,
        status,
        tags: tags || [],
        coverImage: coverImage || null,
        metadata,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Failed to update post:", error);
    return NextResponse.json(
      { message: "Failed to update post" },
      { status: 500 },
    );
  }
};

export const DELETE = async ({
  params,
}: {
  params: Promise<Record<string, string>>;
}) => {
  const postId = (await params).id;

  if (!postId) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  try {
    const [deletedPost] = await db
      .delete(posts)
      .where(eq(posts.id, postId))
      .returning();

    if (!deletedPost) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Failed to delete post:", error);
    return NextResponse.json(
      { message: "Failed to delete post" },
      { status: 500 },
    );
  }
};
