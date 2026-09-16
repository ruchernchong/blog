import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { oauthSearchParamsCache } from "@/lib/search-params/oauth";
import { AuthPanelFallback } from "./auth-panel-fallback";
import { LoginForm } from "./login-form";

interface LoginPanelProps {
  searchParams: Promise<SearchParams>;
}

export function LoginPanel({ searchParams }: LoginPanelProps) {
  return (
    <Suspense fallback={<LoginPanelFallback />}>
      <LoginPanelContent searchParams={searchParams} />
    </Suspense>
  );
}

export function LoginPanelFallback() {
  return <AuthPanelFallback label="Loading sign-in options" />;
}

async function LoginPanelContent({ searchParams }: LoginPanelProps) {
  const { clientId, error, errorDescription } =
    await oauthSearchParamsCache.parse(searchParams);

  return (
    <LoginForm
      isOAuthRequest={Boolean(clientId)}
      oauthError={error}
      oauthErrorDescription={errorDescription}
    />
  );
}
