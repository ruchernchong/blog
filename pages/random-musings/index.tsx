import { GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import Layout from "components/Layout";
import { RandomMusing } from "lib/types";

const RandomMusings = ({
  items
}: {
  items: RandomMusing[];
}): InferGetStaticPropsType<typeof getStaticProps> => {
  return (
    <Layout title="Random Musings - Ru Chern">
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
            <Link
              key={title}
              href={`/random-musings/${slug}`}
              className="w-full"
            >
              <div className="prose mb-8 dark:prose-invert">
                <time
                  dateTime={formatISO(parseISO(date))}
                  title={formattedDate}
                  className="italic text-neutral-600 dark:text-neutral-400"
                >
                  {formattedDate}
                </time>
                <div className="text-xl font-medium transition hover:opacity-50">
                  {title}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const items: RandomMusing[] = await fetch(
    "https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json"
  ).then((res) => res.json());

  return {
    props: {
      items
    }
  };
};

export default RandomMusings;
