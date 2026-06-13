import { NextResponse } from "next/server";
import { ERROR_IDS } from "@/constants/error-ids";
import { handleApiError, requireAdmin } from "@/lib/api";
import { listOAuthClients } from "@/lib/queries/oauth-clients";

export const GET = async () => {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  try {
    const clients = await listOAuthClients();
    return NextResponse.json(clients);
  } catch (error) {
    return handleApiError(
      error,
      ERROR_IDS.OAUTH_CLIENT_FETCH_FAILED,
      "fetch OAuth clients",
    );
  }
};
