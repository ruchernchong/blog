import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  handleApiError,
  notFoundResponse,
  parseAndValidateBody,
  requireAuth,
  validateRouteParam,
} from "@/lib/api";
import { mediaService } from "@/lib/services";
import { mediaIdSchema, updateMediaSchema } from "@/types/api";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const paramResult = await validateRouteParam(
    params,
    "id",
    mediaIdSchema,
    "media",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const item = await mediaService.getMediaById(paramResult.data);
    if (!item) return notFoundResponse("Media");
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error, ERROR_IDS.MEDIA_FETCH_FAILED, "fetch media", {
      mediaId: paramResult.data,
    });
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAuth("edit media");
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    mediaIdSchema,
    "media",
  );
  if (!paramResult.success) return paramResult.response;

  const bodyResult = await parseAndValidateBody(request, updateMediaSchema);
  if (!bodyResult.success) return bodyResult.response;

  try {
    const updated = await mediaService.updateMedia(
      paramResult.data,
      bodyResult.data,
    );
    if (!updated) return notFoundResponse("Media");
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, ERROR_IDS.MEDIA_UPDATE_FAILED, "update media", {
      mediaId: paramResult.data,
    });
  }
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAuth("delete media");
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    mediaIdSchema,
    "media",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const deleted = await mediaService.softDeleteMedia(paramResult.data);
    if (!deleted) return notFoundResponse("Media");
    return NextResponse.json({ message: "Media deleted successfully" });
  } catch (error) {
    return handleApiError(error, ERROR_IDS.MEDIA_DELETE_FAILED, "delete media", {
      mediaId: paramResult.data,
    });
  }
};
