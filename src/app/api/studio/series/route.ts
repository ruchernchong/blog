import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  databaseErrorResponse,
  handleApiError,
  isDatabaseError,
  isUniqueConstraintError,
  parseAndValidateBody,
  requireAuth,
} from "@/lib/api";
import { logError } from "@/lib/logger";
import { db, type InsertSeries, series } from "@/schema";
import { createSeriesSchema } from "@/types/api";

export const GET = async () => {
  try {
    const allSeries = await db
      .select()
      .from(series)
      .orderBy(desc(series.updatedAt));

    return NextResponse.json(allSeries);
  } catch (error) {
    return handleApiError(error, ERROR_IDS.SERIES_FETCH_FAILED, "fetch series");
  }
};

export const POST = async (request: Request) => {
  const authResult = await requireAuth("create series");
  if (!authResult.success) return authResult.response;

  const bodyResult = await parseAndValidateBody(request, createSeriesSchema);
  if (!bodyResult.success) return bodyResult.response;

  const { title, slug, description, status, coverImage } = bodyResult.data;

  try {
    const newSeries: InsertSeries = {
      title,
      slug,
      description,
      status,
      coverImage,
    };

    const [createdSeries] = await db
      .insert(series)
      .values(newSeries)
      .returning();

    return NextResponse.json(createdSeries, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      logError(ERROR_IDS.SERIES_DUPLICATE_SLUG, error, { slug });
      return NextResponse.json(
        {
          message: `A series with slug "${slug}" already exists. Please use a different slug.`,
        },
        { status: 409 },
      );
    }

    if (isDatabaseError(error)) {
      logError(ERROR_IDS.DB_CONNECTION_FAILED, error, {
        operation: "insert_series",
      });
      return databaseErrorResponse();
    }

    logError(ERROR_IDS.SERIES_CREATE_FAILED, error, { title, slug });
    return NextResponse.json(
      { message: "Failed to create series due to an unexpected error" },
      { status: 500 },
    );
  }
};
