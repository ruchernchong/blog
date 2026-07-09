import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Mdx } from "@/app/(main)/blog/components/mdx";
import { getDocContent } from "@/lib/docs";

async function UsageIngestionContent() {
  "use cache";
  const content = await getDocContent("usage-ingestion");
  if (!content) notFound();

  return <Mdx content={content} />;
}

export const metadata: Metadata = {
  title: "Token Usage Ingestion",
  description:
    "Endpoint contract and operator workflow for importing local agent token usage into ruchern.dev.",
};

export default function UsageIngestionPage() {
  return (
    <Suspense
      fallback={
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          Loading documentation...
        </div>
      }
    >
      <UsageIngestionContent />
    </Suspense>
  );
}
