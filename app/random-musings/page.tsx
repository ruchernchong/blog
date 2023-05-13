import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import { RandomMusing } from "@/lib/types";

const RandomMusingsPage = async () => {
  const items: RandomMusing[] = await fetch(
    "https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json"
  ).then((res) => res.json());

  return (
    <>
      <div className="mx-auto mb-8 flex max-w-4xl flex-col items-start justify-center">
        <div className="mb-8">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Random Musings{" "}
            <sup className="sups text-2xl text-neutral-600 dark:text-neutral-400">
              ({items.length})
            </sup>
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 md:mb-0">
            A collection containing fun and interesting things I came across
            randomly
          </p>
        </div>
        {items.map(({ title, date, slug }) => {
          const formattedDate = format(parseISO(date), "dd MMM yyyy");

          return (
            <div key={title} className="prose mb-2 flex dark:prose-invert">
              <time
                dateTime={formatISO(parseISO(date))}
                title={formattedDate}
                className="mr-4 shrink-0 italic text-neutral-600 dark:text-neutral-400"
              >
                {formattedDate}
              </time>
              <Link href={`/random-musings/${slug}`} className="no-underline">
                <span className="text-xl font-medium transition hover:opacity-50">
                  {title}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default RandomMusingsPage;
