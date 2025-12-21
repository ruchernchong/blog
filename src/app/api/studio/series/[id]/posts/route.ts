import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  handleApiError,
  notFoundResponse,
  parseAndValidateBody,
  requireAuth,
  validateRouteParam,
} from "@/lib/api";
import { logError } from "@/lib/logger";
import { getPostsInSeries, getSeriesById } from "@/lib/queries/series";
import { db, posts } from "@/schema";
import { reorderPostsSchema, seriesIdSchema } from "@/types/api";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const paramResult = await validateRouteParam(
    params,
    "id",
    seriesIdSchema,
    "series",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const seriesId = paramResult.data;

    const seriesItem = await getSeriesById(seriesId);

    if (!seriesItem) return notFoundResponse("Series");

    const seriesPosts = await getPostsInSeries(seriesId);

    return NextResponse.json(seriesPosts);
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.SERIES_FETCH_FAILED,
      "fetch series posts",
      { seriesId: paramResult.data },
    );
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAuth("reorder series posts");
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    seriesIdSchema,
    "series",
  );
  if (!paramResult.success) return paramResult.response;

  const bodyResult = await parseAndValidateBody(request, reorderPostsSchema);
  if (!bodyResult.success) return bodyResult.response;

  const seriesId = paramResult.data;
  const { posts: postOrders } = bodyResult.data;

  try {
    const seriesItem = await getSeriesById(seriesId);

    if (!seriesItem) return notFoundResponse("Series");

    // Update each post's order
    await Promise.all(
      postOrders.map(({ id, order }) =>
        db
          .update(posts)
          .set({ seriesOrder: order, updatedAt: new Date() })
          .where(eq(posts.id, id)),
      ),
    );

    // Fetch updated posts
    const updatedPosts = await getPostsInSeries(seriesId);

    return NextResponse.json(updatedPosts);
  } catch (error) {
    logError(ERROR_IDS.SERIES_REORDER_FAILED, error, { seriesId });
    return handleApiError(
      error,
      ERROR_IDS.SERIES_REORDER_FAILED,
      "reorder series posts",
      { seriesId },
    );
  }
};
