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
import { getSeriesById } from "@/lib/queries/series";
import { db, series } from "@/schema";
import { seriesIdSchema, updateSeriesSchema } from "@/types/api";

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
    const seriesItem = await getSeriesById(paramResult.data);

    if (!seriesItem) return notFoundResponse("Series");

    return NextResponse.json(seriesItem);
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.SERIES_FETCH_FAILED,
      "fetch series",
      { seriesId: paramResult.data },
    );
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAuth("edit series");
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    seriesIdSchema,
    "series",
  );
  if (!paramResult.success) return paramResult.response;

  const bodyResult = await parseAndValidateBody(request, updateSeriesSchema);
  if (!bodyResult.success) return bodyResult.response;

  const seriesId = paramResult.data;

  try {
    const existingSeries = await getSeriesById(seriesId);

    if (!existingSeries) return notFoundResponse("Series");

    const { title, slug, description, status, coverImage } = bodyResult.data;

    const [updatedSeries] = await db
      .update(series)
      .set({
        title: title ?? existingSeries.title,
        slug: slug ?? existingSeries.slug,
        description:
          description !== undefined ? description : existingSeries.description,
        status: status ?? existingSeries.status,
        coverImage:
          coverImage !== undefined ? coverImage : existingSeries.coverImage,
        updatedAt: new Date(),
      })
      .where(eq(series.id, seriesId))
      .returning();

    return NextResponse.json(updatedSeries);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      logError(ERROR_IDS.SERIES_DUPLICATE_SLUG, error, {
        seriesId,
        slug: bodyResult.data.slug,
      });
      return NextResponse.json(
        {
          message: `A series with slug "${bodyResult.data.slug}" already exists. Please use a different slug.`,
        },
        { status: 409 },
      );
    }

    if (isDatabaseError(error)) {
      logError(ERROR_IDS.DB_CONNECTION_FAILED, error, {
        operation: "update_series",
        seriesId,
      });
      return databaseErrorResponse();
    }

    logError(ERROR_IDS.SERIES_UPDATE_FAILED, error, { seriesId });
    return NextResponse.json(
      { message: "Failed to update series" },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAuth("delete series");
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    seriesIdSchema,
    "series",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const [deletedSeries] = await db
      .update(series)
      .set({ deletedAt: new Date() })
      .where(eq(series.id, paramResult.data))
      .returning();

    if (!deletedSeries) return notFoundResponse("Series");

    return NextResponse.json({ message: "Series deleted successfully" });
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.SERIES_DELETE_FAILED,
      "delete series",
      { seriesId: paramResult.data },
    );
  }
};
