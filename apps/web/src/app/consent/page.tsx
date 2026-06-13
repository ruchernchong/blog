import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ConsentForm } from "@/components/auth/consent-form";
import { auth } from "@/lib/auth";
import { db, oauthClient } from "@/schema";

export const metadata: Metadata = {
  title: "Authorise",
  description: "Authorise an application to access your account",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default function ConsentPage({ searchParams }: PageProps) {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-sm">
        <Suspense>
          <ConsentContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function ConsentContent({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { client_id: clientId } = await searchParams;
  if (!clientId) {
    redirect("/studio/posts");
  }

  let clientName: string | undefined;
  if (clientId) {
    const [client] = await db
      .select({ name: oauthClient.name })
      .from(oauthClient)
      .where(eq(oauthClient.clientId, clientId))
      .limit(1);
    clientName = client?.name ?? undefined;
  }

  return <ConsentForm clientName={clientName} />;
}
