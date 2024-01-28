import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allJournals } from "contentlayer/generated";
import { Mdx } from "@/components/Mdx";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import { BASE_URL } from "@/config";

export const generateMetadata = async ({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> => {
  const journal = allJournals.find((journal) =>
    journal.slug.includes(params.slug)
  );

  if (!journal) {
    return notFound();
  }

  const title = journal.title;
  const description = journal.title;
  const publishedTime = journal.publishedAt;
  const ogImageUrl = `${BASE_URL}/og?title=${journal.title}`;
  const images = [ogImageUrl];
  const url = `/${journal.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    alternates: {
      canonical: url,
    },
  };
};

const JournalPage = async ({ params }: { params: { slug: string } }) => {
  const journal = allJournals.find((journal) =>
    journal.slug.includes(params.slug)
  );

  if (!journal) {
    return notFound();
  }

  return (
    <>
      <StructuredData data={journal.structuredData} />
      <article className="prose prose-invert mx-auto mb-16 max-w-4xl prose-a:text-pink-500 prose-img:rounded-2xl">
        <Typography variant="h1" className="text-center">
          {journal.title}
        </Typography>
        <Mdx code={journal.body.code} />
      </article>
    </>
  );
};

export default JournalPage;
