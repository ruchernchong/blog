import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { loadMediaSearchParams } from "@/lib/search-params/media";
import { mediaService } from "@/lib/services";
import { confirmUploadSchema } from "@/types/api";

export const GET = async (request: Request) => {
  try {
    const { search, limit, offset } = loadMediaSearchParams(request);

    const mediaList = await mediaService.getMediaList({
      search: search ?? undefined,
      limit,
      offset,
    });

    return NextResponse.json(mediaList);
  } catch (error) {
    logError(ERROR_IDS.MEDIA_LIST_FAILED, error);

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

export const POST = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized. Please sign in to upload media." },
      { status: 401 },
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

  let validatedData: ReturnType<typeof confirmUploadSchema.parse>;
  try {
    validatedData = confirmUploadSchema.parse(body);
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
    const created = await mediaService.confirmUpload({
      ...validatedData,
      uploadedById: session.user.id,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique constraint")) {
      logError(ERROR_IDS.MEDIA_CONFIRM_FAILED, error, { key: validatedData.key });
      return NextResponse.json(
        { message: "A media item with this key already exists." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message.includes("database")) {
      logError(ERROR_IDS.MEDIA_CONFIRM_FAILED, error);
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    logError(ERROR_IDS.MEDIA_CONFIRM_FAILED, error, { filename: validatedData.filename });
    return NextResponse.json(
      { message: "Failed to confirm upload" },
      { status: 500 },
    );
  }
};
