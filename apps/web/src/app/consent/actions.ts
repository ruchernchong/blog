"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function submitConsent(oauthQuery: string, accept: boolean) {
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("accept", "application/json");

  const result = await auth.api.oauth2Consent({
    body: { accept, oauth_query: oauthQuery },
    headers: requestHeaders,
  });

  if (result?.redirect && result.url) {
    redirect(result.url as Route);
  }
}
