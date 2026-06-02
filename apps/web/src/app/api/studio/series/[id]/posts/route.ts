import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  handleApiError,
  parseAndValidateBody,
  requireAdmin,
  validateSeriesExists,
} from "@/lib/api";
import { logError } from "@/lib/logger";
import { getPostsInSeries } from "@/lib/queries/series";
import { db, posts } from "@/schema";
import { reorderPostsSchema } from "@/types/api";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  try {
    const result = await validateSeriesExists(params);
    if (!result.success) return result.response;

    const seriesPosts = await getPostsInSeries(result.data.seriesId);

    return NextResponse.json(seriesPosts);
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.SERIES_FETCH_FAILED,
      "fetch series posts",
    );
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  const seriesResult = await validateSeriesExists(params);
  if (!seriesResult.success) return seriesResult.response;

  const bodyResult = await parseAndValidateBody(request, reorderPostsSchema);
  if (!bodyResult.success) return bodyResult.response;

  const { seriesId } = seriesResult.data;
  const { posts: postOrders } = bodyResult.data;

  try {
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
