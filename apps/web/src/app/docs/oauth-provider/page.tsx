import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mdx } from "@/app/(main)/blog/components/mdx";
import { getDocContent } from "@/lib/docs";

export const metadata: Metadata = {
  title: "OAuth Provider Integration",
  description:
    "How a client application authenticates users and calls protected ruchern.dev routes using the OAuth 2.1 / OIDC provider.",
};

export default function OAuthProviderPage() {
  const content = getDocContent("oauth-provider");
  if (!content) notFound();

  return <Mdx content={content} />;
}
