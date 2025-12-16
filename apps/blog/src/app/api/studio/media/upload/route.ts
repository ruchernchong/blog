import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { mediaService } from "@/lib/services";
import { requestUploadSchema } from "@/types/api";

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

  let validatedData: ReturnType<typeof requestUploadSchema.parse>;
  try {
    validatedData = requestUploadSchema.parse(body);
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
    const result = await mediaService.requestUpload(validatedData);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid file type")) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("File too large")) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 },
      );
    }

    logError(ERROR_IDS.UPLOAD_REQUEST_FAILED, error, { filename: validatedData.filename });
    return NextResponse.json(
      { message: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
};
