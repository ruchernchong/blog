import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  databaseErrorResponse,
  handleApiError,
  isDatabaseError,
  isUniqueConstraintError,
  parseAndValidateBody,
  requireAdmin,
} from "@/lib/api";
import { logError } from "@/lib/logger";
import { generatePostMetadata } from "@/lib/post-metadata";
import { db, type InsertPost, posts } from "@/schema";
import { createPostSchema } from "@/types/api";

export const GET = async () => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  try {
    const allPosts = await db.query.posts.findMany({
      orderBy: desc(posts.updatedAt),
      with: {
        author: true,
      },
    });

    return NextResponse.json(allPosts);
  } catch (error) {
    return handleApiError(error, ERROR_IDS.POST_FETCH_FAILED, "fetch posts");
  }
};

export const POST = async (request: Request) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  const bodyResult = await parseAndValidateBody(request, createPostSchema);
  if (!bodyResult.success) return bodyResult.response;

  const {
    title,
    slug,
    summary,
    content,
    status,
    tags,
    coverImage,
    featured,
    seriesId,
    seriesOrder,
  } = bodyResult.data;

  try {
    const publishedAt = status === "published" ? new Date() : null;
    const metadata = generatePostMetadata(
      title,
      slug,
      content,
      summary ?? null,
      publishedAt,
    );

    const newPost: InsertPost = {
      title,
      slug,
      summary,
      content,
      status,
      tags: Array.isArray(tags) ? tags : [],
      coverImage,
      featured,
      seriesId: seriesId ?? null,
      seriesOrder: seriesOrder ?? null,
      metadata,
      publishedAt,
      authorId: authResult.data.user.id,
    };

    const [createdPost] = await db.insert(posts).values(newPost).returning();

    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      logError(ERROR_IDS.POST_DUPLICATE_SLUG, error, { slug });
      return NextResponse.json(
        {
          message: `A post with slug "${slug}" already exists. Please use a different slug.`,
        },
        { status: 409 },
      );
    }

    if (isDatabaseError(error)) {
      logError(ERROR_IDS.DB_CONNECTION_FAILED, error, {
        operation: "insert_post",
      });
      return databaseErrorResponse();
    }

    logError(ERROR_IDS.POST_CREATE_FAILED, error, { title, slug });
    return NextResponse.json(
      { message: "Failed to create post due to an unexpected error" },
      { status: 500 },
    );
  }
};
