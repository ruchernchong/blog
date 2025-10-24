import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import { generatePostMetadata } from "@/lib/post-metadata";
import { db, posts } from "@/schema";
import { postIdSchema, updatePostSchema } from "@/types/api";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  let postId: string;

  // Validate params
  try {
    const resolvedParams = await params;
    postId = postIdSchema.parse(resolvedParams.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid post ID format" },
        { status: 400 },
      );
    }
    logError(ERROR_IDS.INVALID_PARAMS, error);
    return NextResponse.json(
      { message: "Invalid request parameters" },
      { status: 400 },
    );
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
    logError(ERROR_IDS.POST_FETCH_FAILED, error, { postId });

    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch post" },
      { status: 500 },
    );
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  let postId: string;

  // Validate params
  try {
    const resolvedParams = await params;
    postId = postIdSchema.parse(resolvedParams.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid post ID format" },
        { status: 400 },
      );
    }
    logError(ERROR_IDS.INVALID_PARAMS, error);
    return NextResponse.json(
      { message: "Invalid request parameters" },
      { status: 400 },
    );
  }

  let body: unknown;

  // Parse JSON request body
  try {
    body = await request.json();
  } catch (error) {
    logError(ERROR_IDS.INVALID_JSON, error);
    return NextResponse.json(
      { message: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  // Validate request body with Zod
  let validatedData: ReturnType<typeof updatePostSchema.parse>;
  try {
    validatedData = updatePostSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }
    throw error; // Re-throw unexpected errors
  }

  try {
    // Get existing post to check if it exists
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Merge updates with existing post
    const {
      title,
      slug,
      summary,
      content,
      status,
      tags,
      coverImage,
      featured,
    } = validatedData;

    const updatedTitle = title ?? existingPost.title;
    const updatedSlug = slug ?? existingPost.slug;
    const updatedContent = content ?? existingPost.content;
    const updatedSummary =
      summary !== undefined ? summary : existingPost.summary;
    const updatedStatus = status ?? existingPost.status;

    // Preserve original publish date when re-publishing, but set new date for first-time publishes
    // This ensures that changing draft -> published -> draft -> published doesn't alter the original publish date
    let publishedAt = existingPost.publishedAt;
    if (updatedStatus === "published" && !existingPost.publishedAt) {
      publishedAt = new Date(); // First time publishing
    } else if (updatedStatus === "draft") {
      publishedAt = null; // Unpublishing (draft)
    }

    // Generate updated metadata
    const metadata = generatePostMetadata(
      updatedTitle,
      updatedSlug,
      updatedContent,
      updatedSummary,
      publishedAt,
    );

    // Update post
    const [updatedPost] = await db
      .update(posts)
      .set({
        title: updatedTitle,
        slug: updatedSlug,
        summary: updatedSummary,
        content: updatedContent,
        status: updatedStatus,
        tags:
          tags !== undefined
            ? Array.isArray(tags)
              ? tags
              : []
            : existingPost.tags,
        coverImage:
          coverImage !== undefined ? coverImage : existingPost.coverImage,
        featured: featured !== undefined ? featured : existingPost.featured,
        metadata,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    return NextResponse.json(updatedPost);
  } catch (error) {
    // Check for specific database errors
    if (error instanceof Error && error.message.includes("unique constraint")) {
      logError(ERROR_IDS.POST_DUPLICATE_SLUG, error, {
        postId,
        slug: validatedData.slug,
      });
      return NextResponse.json(
        {
          message: `A post with slug "${validatedData.slug}" already exists. Please use a different slug.`,
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message.includes("database")) {
      logError(ERROR_IDS.DB_CONNECTION_FAILED, error, {
        operation: "update_post",
        postId,
      });
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    // Unexpected error
    logError(ERROR_IDS.POST_UPDATE_FAILED, error, { postId });
    return NextResponse.json(
      { message: "Failed to update post" },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  let postId: string;

  // Validate params
  try {
    const resolvedParams = await params;
    postId = postIdSchema.parse(resolvedParams.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid post ID format" },
        { status: 400 },
      );
    }
    logError(ERROR_IDS.INVALID_PARAMS, error);
    return NextResponse.json(
      { message: "Invalid request parameters" },
      { status: 400 },
    );
  }

  try {
    // Soft-delete: set deletedAt timestamp instead of hard delete
    const [deletedPost] = await db
      .update(posts)
      .set({ deletedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning();

    if (!deletedPost) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    logError(ERROR_IDS.POST_DELETE_FAILED, error, { postId });

    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Failed to delete post" },
      { status: 500 },
    );
  }
};
