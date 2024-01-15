import { Metadata } from "next";
import Link from "next/link";
import { allJournals } from "contentlayer/generated";
import { format, formatISO, parseISO } from "date-fns";
import globalMetadata from "@/app/metadata";
import { openGraphImage, twitterImage } from "@/app/shared-metadata";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import { sortByLatest } from "@/lib/sortByLatest";
import { WebPage, WithContext } from "schema-dts";

const title = `Journals`;
const description =
  "A collection containing fun and interesting things I came across randomly.";

export const metadata: Metadata = {
  title: "Journals",
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: "/journals",
    ...openGraphImage,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
    ...twitterImage,
  },
  alternates: {
    canonical: "/journals",
  },
};

const JournalsPage = () => {
  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    // TODO: Upgrade description from a single source as variable
    description,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <Typography variant="h1" className="mb-8">
        Journals
      </Typography>
      <Typography variant="h2" className="mb-8">
        {description}
      </Typography>
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
                    <Typography
                      variant="h3"
                      className="transition hover:text-pink-500"
                    >
                      {title}
                    </Typography>
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
