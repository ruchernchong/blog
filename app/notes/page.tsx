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
import { BASE_URL } from "@/config";

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
    description,
    url: `${BASE_URL}/notes`,
  };

  const sortedNotes = allNotes.sort(sortByLatest);

  return (
    <>
      <StructuredData data={structuredData} />
      <div
        data-umami-event="page-view"
        data-umami-event-page="notes"
        data-umami-event-note-count={sortedNotes.length}
      >
        <Typography
          variant="h1"
          className="mb-8"
          data-umami-event="notes-title-view"
        >
          Notes
        </Typography>
        <Typography
          variant="h2"
          className="mb-8"
          data-umami-event="notes-description-view"
        >
          {description}
        </Typography>
        <div className="flex flex-col justify-center gap-8">
          <div
            className="flex flex-col gap-2"
            data-umami-event="notes-list-view"
          >
            {sortedNotes.map(({ title, publishedAt, url }) => {
              const formattedDate = format(
                parseISO(publishedAt),
                "dd MMM yyyy",
              );

              return (
                <div
                  key={title}
                  className="flex gap-4 md:items-center"
                  data-umami-event="note-item-view"
                  data-umami-event-title={title}
                >
                  <time
                    dateTime={formatISO(parseISO(publishedAt))}
                    title={formattedDate}
                    className="shrink-0 italic text-gray-300"
                    data-umami-event="note-date-view"
                    data-umami-event-date={formattedDate}
                  >
                    {formattedDate}
                  </time>
                  <Link
                    href={url}
                    className="no-underline"
                    data-umami-event="note-link-click"
                    data-umami-event-title={title}
                    data-umami-event-url={url}
                  >
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
      </div>
    </>
  );
};

export default NotesPage;
