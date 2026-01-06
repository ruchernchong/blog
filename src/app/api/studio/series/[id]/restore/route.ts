import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  handleApiError,
  notFoundResponse,
  requireAdmin,
  validateRouteParam,
} from "@/lib/api";
import { db, series } from "@/schema";
import { seriesIdSchema } from "@/types/api";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    seriesIdSchema,
    "series",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const [restoredSeries] = await db
      .update(series)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(series.id, paramResult.data))
      .returning();

    if (!restoredSeries) return notFoundResponse("Series");

    return NextResponse.json(restoredSeries);
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.SERIES_UPDATE_FAILED,
      "restore series",
      { seriesId: paramResult.data },
    );
  }
};
