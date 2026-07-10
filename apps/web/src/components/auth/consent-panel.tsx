import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { oauthSearchParamsCache } from "@/lib/search-params/oauth";
import { db, oauthClient } from "@/schema";
import { AuthPanelFallback } from "./auth-panel-fallback";
import { ConsentForm } from "./consent-form";

interface ConsentPanelProps {
  searchParams: Promise<SearchParams>;
}

export function ConsentPanel({ searchParams }: ConsentPanelProps) {
  return (
    <Suspense fallback={<ConsentPanelFallback />}>
      <ConsentPanelContent searchParams={searchParams} />
    </Suspense>
  );
}

export function ConsentPanelFallback() {
  return <AuthPanelFallback label="Loading authorisation request" />;
}

async function ConsentPanelContent({ searchParams }: ConsentPanelProps) {
  const [{ clientId, scope }, session] = await Promise.all([
    oauthSearchParamsCache.parse(searchParams),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!session) {
    redirect("/login");
  }

  if (!clientId) {
    redirect("/studio/posts");
  }

  const [client] = await db
    .select({ name: oauthClient.name })
    .from(oauthClient)
    .where(eq(oauthClient.clientId, clientId))
    .limit(1);

  return (
    <ConsentForm
      clientName={client?.name ?? undefined}
      scopes={scope?.split(" ").filter(Boolean) ?? []}
    />
  );
}
