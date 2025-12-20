import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  databaseErrorResponse,
  handleApiError,
  isDatabaseError,
  isUniqueConstraintError,
  notFoundResponse,
  parseAndValidateBody,
  requireAuth,
  validateRouteParam,
} from "@/lib/api";
import { logError } from "@/lib/logger";
import { generatePostMetadata } from "@/lib/post-metadata";
import { cacheInvalidationService } from "@/lib/services";
import { db, posts } from "@/schema";
import { postIdSchema, updatePostSchema } from "@/types/api";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const paramResult = await validateRouteParam(
    params,
    "id",
    postIdSchema,
    "post",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, paramResult.data))
      .limit(1);

    if (!post) return notFoundResponse("Post");

    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error, ERROR_IDS.POST_FETCH_FAILED, "fetch post", {
      postId: paramResult.data,
    });
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAuth("edit posts");
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    postIdSchema,
    "post",
  );
  if (!paramResult.success) return paramResult.response;

  const bodyResult = await parseAndValidateBody(request, updatePostSchema);
  if (!bodyResult.success) return bodyResult.response;

  const postId = paramResult.data;

  try {
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!existingPost) return notFoundResponse("Post");

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

    const updatedTitle = title ?? existingPost.title;
    const updatedSlug = slug ?? existingPost.slug;
    const updatedContent = content ?? existingPost.content;
    const updatedSummary =
      summary !== undefined ? summary : existingPost.summary;
    const updatedStatus = status ?? existingPost.status;

    // Preserve original publish date when re-publishing, but set new date for first-time publishes
    let publishedAt = existingPost.publishedAt;
    if (updatedStatus === "published" && !existingPost.publishedAt) {
      publishedAt = new Date();
    } else if (updatedStatus === "draft") {
      publishedAt = null;
    }

    const metadata = generatePostMetadata(
      updatedTitle,
      updatedSlug,
      updatedContent,
      updatedSummary,
      publishedAt,
    );

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
        coverImage: coverImage ?? existingPost.coverImage,
        featured: featured ?? existingPost.featured,
        seriesId: seriesId ?? existingPost.seriesId,
        seriesOrder: seriesOrder ?? existingPost.seriesOrder,
        metadata,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    await cacheInvalidationService.invalidatePost(updatedSlug);

    const tagsChanged =
      tags !== undefined &&
      JSON.stringify([...tags].sort((a, b) => a.localeCompare(b))) !==
        JSON.stringify(
          [...existingPost.tags].sort((a, b) => a.localeCompare(b)),
        );

    if (tagsChanged) {
      const allAffectedTags = [
        ...new Set([...existingPost.tags, ...(tags || [])]),
      ];
      await cacheInvalidationService.invalidateRelatedByTags(
        allAffectedTags,
        updatedSlug,
      );
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      logError(ERROR_IDS.POST_DUPLICATE_SLUG, error, {
        postId,
        slug: bodyResult.data.slug,
      });
      return NextResponse.json(
        {
          message: `A post with slug "${bodyResult.data.slug}" already exists. Please use a different slug.`,
        },
        { status: 409 },
      );
    }

    if (isDatabaseError(error)) {
      logError(ERROR_IDS.DB_CONNECTION_FAILED, error, {
        operation: "update_post",
        postId,
      });
      return databaseErrorResponse();
    }

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
  const authResult = await requireAuth("delete posts");
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    postIdSchema,
    "post",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const [deletedPost] = await db
      .update(posts)
      .set({ deletedAt: new Date() })
      .where(eq(posts.id, paramResult.data))
      .returning();

    if (!deletedPost) return notFoundResponse("Post");

    await cacheInvalidationService.invalidatePopularPost(deletedPost.slug);

    if (deletedPost.tags.length > 0) {
      await cacheInvalidationService.invalidateRelatedByTags(
        deletedPost.tags,
        deletedPost.slug,
      );
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    return handleApiError(error, ERROR_IDS.POST_DELETE_FAILED, "delete post", {
      postId: paramResult.data,
    });
  }
};
