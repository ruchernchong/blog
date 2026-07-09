import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Mdx } from "@/app/(main)/blog/components/mdx";
import { getDocContent } from "@/lib/docs";

async function OAuthProviderContent() {
  "use cache";
  const content = await getDocContent("oauth-provider");
  if (!content) notFound();

  return <Mdx content={content} />;
}

export const metadata: Metadata = {
  title: "OAuth Provider Integration",
  description:
    "How a client application authenticates users and calls protected ruchern.dev routes using the OAuth 2.1 / OIDC provider.",
};

export default function OAuthProviderPage() {
  return (
    <Suspense
      fallback={
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          Loading documentation...
        </div>
      }
    >
      <OAuthProviderContent />
    </Suspense>
  );
}
