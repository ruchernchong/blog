import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allJournals } from "contentlayer/generated";
import { Mdx } from "@/components/Mdx";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import { BASE_URL } from "@/config";

type Params = Promise<{ slug: string }>;

export const generateMetadata = async (props: {
  params: Params;
}): Promise<Metadata> => {
  const params = await props.params;
  const journal = allJournals.find((journal) => journal.slug === params.slug)!;

  const title = journal.title;
  const description = journal.title;
  const publishedTime = journal.publishedAt;
  const images = `${BASE_URL}/og?title=${title}`;
  const url = journal.url;

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

export const generateStaticParams = () =>
  allJournals.map(({ slug }) => ({ slug }));

const JournalPage = async (props: { params: Params }) => {
  const params = await props.params;
  const journal = allJournals.find((journal) => journal.slug === params.slug);

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
