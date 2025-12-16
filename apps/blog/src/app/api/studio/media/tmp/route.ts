import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { mediaService } from "@/lib/services";
import { confirmTempUploadSchema } from "@/types/api";

export const POST = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorised. Please sign in to upload media." },
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

  let validatedData: ReturnType<typeof confirmTempUploadSchema.parse>;
  try {
    validatedData = confirmTempUploadSchema.parse(body);
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
    const id = crypto.randomUUID();
    await mediaService.saveTempMedia(id, {
      key: validatedData.key,
      filename: validatedData.filename,
      url: validatedData.url,
      mimeType: validatedData.mimeType,
      size: validatedData.size,
      width: validatedData.width,
      height: validatedData.height,
      alt: validatedData.alt,
      caption: validatedData.caption,
      uploadedById: session.user.id,
      slug: validatedData.slug,
      createdAt: Date.now(),
    });

    return NextResponse.json({ id, ...validatedData }, { status: 201 });
  } catch (error) {
    logError(ERROR_IDS.TEMP_MEDIA_SAVE_FAILED, error, {
      filename: validatedData.filename,
      slug: validatedData.slug,
    });
    return NextResponse.json(
      { message: "Failed to save temp media" },
      { status: 500 },
    );
  }
};
