import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mdx } from "@/app/(main)/blog/components/mdx";
import { getDocContent } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Token Usage Ingestion",
  description:
    "Endpoint contract and operator workflow for importing local agent token usage into ruchern.dev.",
};

export default function UsageIngestionPage() {
  const content = getDocContent("usage-ingestion");
  if (!content) notFound();

  return <Mdx content={content} />;
}
