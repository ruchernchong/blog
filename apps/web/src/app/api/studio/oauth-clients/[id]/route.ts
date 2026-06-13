import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import {
  handleApiError,
  notFoundResponse,
  parseAndValidateBody,
  requireAdmin,
  validateRouteParam,
} from "@/lib/api";
import {
  deleteOAuthClient,
  getOAuthClientDetail,
  setOAuthClientDisabled,
} from "@/lib/queries/oauth-clients";
import { oauthClientIdSchema, toggleOAuthClientSchema } from "@/types/api";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    oauthClientIdSchema,
    "OAuth client",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const detail = await getOAuthClientDetail(paramResult.data);
    if (!detail) return notFoundResponse("OAuth client");

    return NextResponse.json(detail);
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.OAUTH_CLIENT_FETCH_FAILED,
      "fetch OAuth client",
      { clientId: paramResult.data },
    );
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    oauthClientIdSchema,
    "OAuth client",
  );
  if (!paramResult.success) return paramResult.response;

  const bodyResult = await parseAndValidateBody(
    request,
    toggleOAuthClientSchema,
  );
  if (!bodyResult.success) return bodyResult.response;

  try {
    const updated = await setOAuthClientDisabled(
      paramResult.data,
      bodyResult.data.disabled,
    );
    if (!updated) return notFoundResponse("OAuth client");

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.OAUTH_CLIENT_UPDATE_FAILED,
      "update OAuth client",
      { clientId: paramResult.data },
    );
  }
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  const paramResult = await validateRouteParam(
    params,
    "id",
    oauthClientIdSchema,
    "OAuth client",
  );
  if (!paramResult.success) return paramResult.response;

  try {
    const deleted = await deleteOAuthClient(paramResult.data);
    if (!deleted) return notFoundResponse("OAuth client");

    return NextResponse.json({ message: "OAuth client deleted successfully" });
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.OAUTH_CLIENT_DELETE_FAILED,
      "delete OAuth client",
      { clientId: paramResult.data },
    );
  }
};
