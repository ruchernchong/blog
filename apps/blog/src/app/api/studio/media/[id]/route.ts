import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { mediaService } from "@/lib/services";
import { mediaIdSchema, updateMediaSchema } from "@/types/api";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  let mediaId: string;

  try {
    const resolvedParams = await params;
    mediaId = mediaIdSchema.parse(resolvedParams.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid media ID format" },
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
    const item = await mediaService.getMediaById(mediaId);

    if (!item) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    logError(ERROR_IDS.MEDIA_FETCH_FAILED, error, { mediaId });

    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch media" },
      { status: 500 },
    );
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized. Please sign in to edit media." },
      { status: 401 },
    );
  }

  let mediaId: string;

  try {
    const resolvedParams = await params;
    mediaId = mediaIdSchema.parse(resolvedParams.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid media ID format" },
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

  try {
    body = await request.json();
  } catch (error) {
    logError(ERROR_IDS.INVALID_JSON, error);
    return NextResponse.json(
      { message: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  let validatedData: ReturnType<typeof updateMediaSchema.parse>;
  try {
    validatedData = updateMediaSchema.parse(body);
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
    throw error;
  }

  try {
    const updated = await mediaService.updateMedia(mediaId, validatedData);

    if (!updated) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    logError(ERROR_IDS.MEDIA_UPDATE_FAILED, error, { mediaId });

    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Failed to update media" },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized. Please sign in to delete media." },
      { status: 401 },
    );
  }

  let mediaId: string;

  try {
    const resolvedParams = await params;
    mediaId = mediaIdSchema.parse(resolvedParams.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid media ID format" },
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
    const deleted = await mediaService.softDeleteMedia(mediaId);

    if (!deleted) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Media deleted successfully" });
  } catch (error) {
    logError(ERROR_IDS.MEDIA_DELETE_FAILED, error, { mediaId });

    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Failed to delete media" },
      { status: 500 },
    );
  }
};
