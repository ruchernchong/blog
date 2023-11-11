import { Metadata } from "next";
import { allJournals } from "contentlayer/generated";
import { Mdx } from "@/components/Mdx";
import { StructuredData } from "@/components/StructuredData";
import { H1 } from "@/components/Typography";
import { HOST_URL } from "@/config";
import "@code-hike/mdx/dist/index.css";

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const journal = allJournals.find((journal) =>
    journal.slug.includes(params.slug)
  );

  if (!journal) {
    return;
  }

  const title = journal.title;
  const description = journal.title;
  const publishedTime = new Date(journal.publishedAt).toISOString();
  const ogImageUrl = `${HOST_URL}/api/og?title${journal.title}`;
  const images = [ogImageUrl];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: journal.url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    alternates: {
      canonical: journal.url,
    },
  };
};

const JournalPage = async ({ params }) => {
  const journal = allJournals.find((journal) =>
    journal.slug.includes(params.slug)
  );

  return (
    <>
      <StructuredData data={journal.structuredData} />
      <article className="prose prose-invert mx-auto mb-16 max-w-4xl prose-a:text-indigo-300 prose-img:rounded-2xl">
        <H1 className="text-center">{journal.title}</H1>
        <Mdx code={journal.body.code} />
      </article>
    </>
  );
};

export default JournalPage;
