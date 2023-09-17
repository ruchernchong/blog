import Link from "next/link";
import { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import StructuredData from "@/components/StructuredData";
import { H1 } from "@/components/Typography";
import { HOST_URL } from "@/config";
import { format, formatISO, parseISO } from "date-fns";
import { RandomMusing } from "@/lib/types";
import { WebPage, WithContext } from "schema-dts";

const pageDescription: string =
  "A collection containing fun and interesting things I came across randomly.";

export const metadata: Metadata = {
  ...globalMetadata,
  title: "Random Musings",
  description: pageDescription,
  openGraph: {
    ...globalMetadata.openGraph,
    title: "Random Musings | Ru Chern",
    description: pageDescription,
    url: `${HOST_URL}/random-musings`,
  },
  twitter: {
    ...globalMetadata.twitter,
    title: "Random Musings | Ru Chern",
    description: pageDescription,
  },
};

const RandomMusingsPage = async () => {
  const items: RandomMusing[] = await fetch(
    "https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json"
  ).then((res) => res.json());

  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Random Musings | Ru Chern",
    // TODO: Upgrade description from a single source as variable
    description: pageDescription,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col justify-center gap-8">
        <div className="flex flex-col gap-4">
          <H1>Random Musings</H1>
          <div className="text-neutral-400">
            <div>{pageDescription}</div>
            <em>
              <span className="text-xl font-extrabold text-indigo-300">
                {items.length}
              </span>
              &nbsp;random and interesting encounters so far...
            </em>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {items.map(({ title, date, slug }) => {
            const formattedDate = format(parseISO(date), "dd MMM yyyy");

            return (
              <div key={title} className="flex items-center gap-4">
                <time
                  dateTime={formatISO(parseISO(date))}
                  title={formattedDate}
                  className="shrink-0 italic text-neutral-400"
                >
                  {formattedDate}
                </time>
                <Link href={`/random-musings/${slug}`} className="no-underline">
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

export default RandomMusingsPage;
