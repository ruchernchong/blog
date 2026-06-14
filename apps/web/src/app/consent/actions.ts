"use server";

import { APIError } from "better-auth/api";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";

export interface ConsentResult {
  error?: string;
}

export async function submitConsent(
  oauthQuery: string,
  accept: boolean,
): Promise<ConsentResult> {
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("accept", "application/json");

  let redirectUrl: string | undefined;

  try {
    const result = await auth.api.oauth2Consent({
      body: { accept, oauth_query: oauthQuery },
      headers: requestHeaders,
    });

    if (result?.redirect && result.url) {
      redirectUrl = result.url;
    }
  } catch (error) {
    // Better Auth's APIError carries its detail on `body`/`status`, not on
    // `message`, so log those explicitly — otherwise the entry is empty.
    logError(
      AUTH_ERROR.OAUTH_CONSENT_FAILED,
      error,
      error instanceof APIError
        ? { status: error.status, body: error.body }
        : undefined,
    );

    // A stale, expired, or already-consumed authorisation request surfaces as
    // a Better Auth APIError (e.g. "request not found"). Return it to the
    // client so it can prompt a retry rather than throwing a masked 500.
    if (error instanceof APIError) {
      const description = error.body?.error_description;
      return {
        error:
          typeof description === "string" && description.length > 0
            ? description
            : "This authorisation request has expired. Please start again.",
      };
    }

    return { error: "Unable to complete authorisation. Please try again." };
  }

  // redirect() must run outside the try/catch: it throws NEXT_REDIRECT, which
  // is control flow, not an error.
  if (redirectUrl) {
    redirect(redirectUrl as Route);
  }

  return {};
}
