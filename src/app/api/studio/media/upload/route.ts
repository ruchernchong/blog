import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import { handleApiError, parseAndValidateBody, requireAdmin } from "@/lib/api";
import { mediaService } from "@/lib/services";
import { requestUploadSchema } from "@/types/api";

export const POST = async (request: Request) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  const bodyResult = await parseAndValidateBody(request, requestUploadSchema);
  if (!bodyResult.success) return bodyResult.response;

  try {
    const result = await mediaService.requestUpload(bodyResult.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid file type")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes("File too large")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return handleApiError(
      error,
      ERROR_IDS.UPLOAD_REQUEST_FAILED,
      "generate upload URL",
      { filename: bodyResult.data.filename },
    );
  }
};
