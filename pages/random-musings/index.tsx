import fs from "fs";
import { GetStaticProps } from "next";
import Link from "next/link";
import matter from "gray-matter";
import Layout from "components/Layout";
import { format, parseISO } from "date-fns";

const RandomMusings = ({ items }) => {
  const sortedItemsByDate = items.sort(
    (a, b) =>
      new Date(b.frontmatter.date).valueOf() -
      new Date(a.frontmatter.date).valueOf()
  );

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
        {sortedItemsByDate.map(({ slug, frontmatter }) => {
          const { title, date } = frontmatter;

          return (
            <Link
              key={title}
              href={`/random-musings/${slug}`}
              className="w-full"
            >
              <div className="prose mb-8 transition hover:opacity-50 dark:prose-invert">
                <div className="">{format(parseISO(date), "dd MMM yyyy")}</div>
                <div className="text-xl">{title}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const files = fs.readdirSync("data/random-musings");
  const items = files.map((file) => {
    const slug = file.replace(".md", "");
    const readFile = fs.readFileSync(`data/random-musings/${file}`, "utf-8");
    const { data } = matter(readFile);

    return {
      slug,
      frontmatter: data
    };
  });

  return {
    props: {
      items
    }
  };
};

export default RandomMusings;
