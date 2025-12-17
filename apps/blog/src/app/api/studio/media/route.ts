import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  conflictResponse,
  handleApiError,
  isUniqueConstraintError,
  parseAndValidateBody,
  requireAuth,
} from "@/lib/api";
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
    return handleApiError(error, ERROR_IDS.MEDIA_LIST_FAILED, "fetch media");
  }
};

export const POST = async (request: Request) => {
  const authResult = await requireAuth("upload media");
  if (!authResult.success) return authResult.response;

  const bodyResult = await parseAndValidateBody(request, confirmUploadSchema);
  if (!bodyResult.success) return bodyResult.response;

  try {
    const created = await mediaService.confirmUpload({
      ...bodyResult.data,
      uploadedById: authResult.data.user.id,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      logError(ERROR_IDS.MEDIA_CONFIRM_FAILED, error, {
        key: bodyResult.data.key,
      });
      return conflictResponse("media item", "key");
    }

    return handleApiError(
      error,
      ERROR_IDS.MEDIA_CONFIRM_FAILED,
      "confirm upload",
      { filename: bodyResult.data.filename },
    );
  }
};
