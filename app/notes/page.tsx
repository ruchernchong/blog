import type { Metadata } from "next";
import Link from "next/link";
import { allNotes } from "contentlayer/generated";
import { format, formatISO, parseISO } from "date-fns";
import globalMetadata from "@/app/metadata";
import { openGraphImage, twitterImage } from "@/app/shared-metadata";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import { sortByLatest } from "@/lib/sortByLatest";
import type { WebPage, WithContext } from "schema-dts";

const title = "Notes";
const description =
  "A collection containing fun and interesting things I came across randomly.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: "/notes",
    ...openGraphImage,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
    ...twitterImage,
  },
  alternates: {
    canonical: "/notes",
  },
};

const NotesPage = () => {
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
        Notes
      </Typography>
      <Typography variant="h2" className="mb-8">
        {description}
      </Typography>
      <div className="flex flex-col justify-center gap-8">
        <div className="flex flex-col gap-2">
          {allNotes.sort(sortByLatest).map(({ title, publishedAt, url }) => {
            const formattedDate = format(parseISO(publishedAt), "dd MMM yyyy");

            return (
              <div key={title} className="flex gap-4 md:items-center">
                <time
                  dateTime={formatISO(parseISO(publishedAt))}
                  title={formattedDate}
                  className="shrink-0 italic text-gray-300"
                >
                  {formattedDate}
                </time>
                <Link href={url} className="no-underline">
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

export default NotesPage;
