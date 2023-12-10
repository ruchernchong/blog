import { Metadata } from "next";
import Link from "next/link";
import { allJournals } from "contentlayer/generated";
import { format, formatISO, parseISO } from "date-fns";
import { WebPage, WithContext } from "schema-dts";
import globalMetadata from "@/app/metadata";
import { StructuredData } from "@/components/StructuredData";
import { H1, H2, H3 } from "@/components/Typography";
import { sortByLatest } from "@/lib/sortByLatest";
import { BASE_URL } from "@/config";

const title = `Journals`;
const pageDescription =
  "A collection containing fun and interesting things I came across randomly.";

export const metadata: Metadata = {
  ...globalMetadata,
  title: "Journals",
  description: pageDescription,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description: pageDescription,
    url: `${BASE_URL}/journals`,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description: pageDescription,
  },
};

const JournalsPage = () => {
  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    // TODO: Upgrade description from a single source as variable
    description: pageDescription,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <H1 className="mb-8">Journals</H1>
      <H2 className="mb-8">{pageDescription}</H2>
      <div className="flex flex-col justify-center gap-8">
        <div className="flex flex-col gap-2">
          {allJournals
            .sort(sortByLatest)
            .map(({ title, publishedAt, slug }) => {
              const formattedDate = format(
                parseISO(publishedAt as string),
                "dd MMM yyyy"
              );

              return (
                <div key={title} className="flex gap-4 md:items-center">
                  <time
                    dateTime={formatISO(parseISO(publishedAt as string))}
                    title={formattedDate}
                    className="shrink-0 italic text-gray-300"
                  >
                    {formattedDate}
                  </time>
                  <Link href={slug} className="no-underline">
                    <H3 className="transition hover:text-pink-500">{title}</H3>
                  </Link>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};

export default JournalsPage;
