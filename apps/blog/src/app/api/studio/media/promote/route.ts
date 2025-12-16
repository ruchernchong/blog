import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { mediaService } from "@/lib/services";

const promoteSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export const POST = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorised. Please sign in." },
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

  let validatedData: ReturnType<typeof promoteSchema.parse>;
  try {
    validatedData = promoteSchema.parse(body);
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
    const promoted = await mediaService.promoteMedia(validatedData.slug);

    return NextResponse.json({
      message: `Promoted ${promoted.length} media items`,
      promoted: promoted.length,
    });
  } catch (error) {
    logError(ERROR_IDS.MEDIA_PROMOTE_FAILED, error, {
      slug: validatedData.slug,
    });
    return NextResponse.json(
      { message: "Failed to promote media" },
      { status: 500 },
    );
  }
};
