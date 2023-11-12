import { Metadata } from "next";
import Link from "next/link";
import { allJournals } from "contentlayer/generated";
import { format, formatISO, parseISO } from "date-fns";
import { WebPage, WithContext } from "schema-dts";
import globalMetadata from "@/app/metadata";
import { StructuredData } from "@/components/StructuredData";
import { H1 } from "@/components/Typography";
import { sortByLatest } from "@/lib/sortByLatest";
import { HOST_URL } from "@/config";

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
    url: `${HOST_URL}/journals`,
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
      <div className="flex flex-col justify-center gap-8">
        <div className="flex flex-col gap-4">
          <H1>Journals</H1>
          <div className="text-neutral-400">
            <div>{pageDescription}</div>
            <em>
              <span className="text-xl font-extrabold text-indigo-300">
                {allJournals.length}
              </span>
              &nbsp;random and interesting encounters so far...
            </em>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {allJournals
            .sort(sortByLatest)
            .map(({ title, publishedAt, slug }) => {
              const formattedDate = format(
                parseISO(publishedAt),
                "dd MMM yyyy"
              );

              return (
                <div key={title} className="flex items-center gap-4">
                  <time
                    dateTime={formatISO(parseISO(publishedAt))}
                    title={formattedDate}
                    className="shrink-0 italic text-neutral-400"
                  >
                    {formattedDate}
                  </time>
                  <Link href={slug} className="no-underline">
                    <h2 className="text-xl font-medium transition hover:opacity-50">
                      {title}
                    </h2>
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
