import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import { Post } from "@/lib/types";

type Props = {
  featuredPosts: Post[];
};

const FeaturedPosts = ({ featuredPosts }: Props) => {
  return (
    <>
      <h2 className="mb-6 text-3xl font-bold md:text-4xl">Featured Posts</h2>
      <div className="mb-12 grid md:grid-cols-3 md:gap-4">
        {featuredPosts
          .slice(0, 3)
          .map(({ title, slug, excerpt, publishedDate }) => {
            const formattedDate = format(
              parseISO(publishedDate),
              "iiii, dd MMMM yyyy"
            );

            return (
              <Link
                key={title}
                href={`/blog/${slug}`}
                className="mb-6 rounded-2xl border p-4 md:mb-0 md:border-neutral-700 hover:md:border-neutral-500"
              >
                <div className="mb-8">
                  <div className="flex flex-col-reverse md:flex-col">
                    <h3 className="text-2xl font-medium hover:opacity-50 md:mb-2">
                      {title}
                    </h3>

                    <time
                      dateTime={formatISO(parseISO(publishedDate))}
                      title={formattedDate}
                      className="italic text-neutral-600 dark:text-neutral-400 md:mb-2"
                    >
                      {formattedDate}
                    </time>
                  </div>
                  <p className="flex-1 text-neutral-600 dark:text-neutral-400">
                    {excerpt}
                  </p>
                </div>
              </Link>
            );
          })}
      </div>
    </>
  );
};

export default FeaturedPosts;
