import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import { generatePostMetadata } from "@/lib/post-metadata";
import { db, type InsertPost, posts } from "@/schema";
import { createPostSchema } from "@/types/api";

export const GET = async () => {
  try {
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.updatedAt));

    return NextResponse.json(allPosts);
  } catch (error) {
    // Common failures: database connection issues, query errors
    logError(ERROR_IDS.POST_FETCH_FAILED, error);

    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch posts" },
      { status: 500 },
    );
  }
};

export const POST = async (request: Request) => {
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
  let validatedData: ReturnType<typeof createPostSchema.parse>;
  try {
    validatedData = createPostSchema.parse(body);
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

  const { title, slug, summary, content, status, tags, coverImage, featured } =
    validatedData;

  try {
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
      summary,
      content,
      status,
      tags: Array.isArray(tags) ? tags : [],
      coverImage,
      featured,
      metadata,
      publishedAt,
    };

    const [createdPost] = await db.insert(posts).values(newPost).returning();

    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    // Check for specific database errors
    if (error instanceof Error && error.message.includes("unique constraint")) {
      logError(ERROR_IDS.POST_DUPLICATE_SLUG, error, { slug });
      return NextResponse.json(
        {
          message: `A post with slug "${slug}" already exists. Please use a different slug.`,
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message.includes("database")) {
      logError(ERROR_IDS.DB_CONNECTION_FAILED, error, {
        operation: "insert_post",
      });
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    // Unexpected error
    logError(ERROR_IDS.POST_CREATE_FAILED, error, { title, slug });
    return NextResponse.json(
      { message: "Failed to create post due to an unexpected error" },
      { status: 500 },
    );
  }
};
