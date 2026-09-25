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
  requireAdmin,
  validateRouteParam,
} from "@/lib/api";
import { logError } from "@/lib/logger";
import { generatePostMetadata } from "@/lib/post-metadata";
import {
  invalidatePopularPost,
  invalidatePost,
  invalidateRelatedByTags,
} from "@/lib/services/cache-invalidation";
import { db, posts } from "@/schema";
import {
  postIdSchema,
  type UpdatePostInput,
  updatePostSchema,
} from "@/types/api";

type Post = typeof posts.$inferSelect;

// Preserve original publish date when re-publishing, but set new date for first-time publishes
function resolvePublishedAt(
  updatedStatus: Post["status"],
  existingPublishedAt: Post["publishedAt"],
) {
  if (updatedStatus === "published" && !existingPublishedAt) {
    return new Date();
  }
  if (updatedStatus === "draft") {
    return null;
  }
  return existingPublishedAt;
}

function resolveTags(tags: UpdatePostInput["tags"], existingTags: string[]) {
  if (tags === undefined) return existingTags;
  return Array.isArray(tags) ? tags : [];
}

function haveTagsChanged(
  tags: UpdatePostInput["tags"],
  existingTags: string[],
) {
  return (
    tags !== undefined &&
    JSON.stringify([...tags].sort((a, b) => a.localeCompare(b))) !==
      JSON.stringify([...existingTags].sort((a, b) => a.localeCompare(b)))
  );
}

function handleUpdatePostError(
  error: unknown,
  postId: string,
  slug: UpdatePostInput["slug"],
) {
  if (isUniqueConstraintError(error)) {
    logError(ERROR_IDS.POST_DUPLICATE_SLUG, error, {
      postId,
      slug,
    });
    return NextResponse.json(
      {
        message: `A post with slug "${slug}" already exists. Please use a different slug.`,
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

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

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
  const authResult = await requireAdmin();
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

    const ifMatch = request.headers.get("If-Match");
    if (ifMatch) {
      const expectedUpdatedAt = ifMatch;
      const currentUpdatedAt = existingPost.updatedAt.toISOString();
      if (expectedUpdatedAt !== currentUpdatedAt) {
        return NextResponse.json(
          {
            message:
              "This post has been edited elsewhere. Refresh to see the latest version.",
          },
          { status: 409 },
        );
      }
    }

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

    const publishedAt = resolvePublishedAt(
      updatedStatus,
      existingPost.publishedAt,
    );

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
        tags: resolveTags(tags, existingPost.tags),
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

    await invalidatePost(updatedSlug);

    if (haveTagsChanged(tags, existingPost.tags)) {
      const allAffectedTags = [
        ...new Set([...existingPost.tags, ...(tags || [])]),
      ];
      await invalidateRelatedByTags(allAffectedTags, updatedSlug);
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    return handleUpdatePostError(error, postId, bodyResult.data.slug);
  }
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAdmin();
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

    await invalidatePopularPost(deletedPost.slug);

    if (deletedPost.tags.length > 0) {
      await invalidateRelatedByTags(deletedPost.tags, deletedPost.slug);
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    return handleApiError(error, ERROR_IDS.POST_DELETE_FAILED, "delete post", {
      postId: paramResult.data,
    });
  }
};
