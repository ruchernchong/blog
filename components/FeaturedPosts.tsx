import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import Card from "@/components/Card";
import { Post } from "@/lib/types";

interface FeaturedPostsProps {
  featuredPosts: Post[];
}

const FeaturedPosts = ({ featuredPosts }: FeaturedPostsProps) => {
  return (
    <>
      <h2 className="mb-6 text-3xl font-bold md:text-4xl">Featured Posts</h2>
      <div className="mb-12 grid gap-4 md:grid-cols-3">
        {featuredPosts
          .slice(0, 3)
          .map(({ title, slug, excerpt, publishedDate }) => {
            const formattedDate = format(
              parseISO(publishedDate),
              "iiii, dd MMMM yyyy"
            );

            return (
              <Card key={title}>
                <Link href={`/blog/${slug}`} className="mb-6 md:mb-0">
                  <time
                    dateTime={formatISO(parseISO(publishedDate))}
                    title={formattedDate}
                    className="mb-2 italic text-neutral-400"
                  >
                    {formattedDate}
                  </time>
                  <h3 className="mb-2 text-2xl font-medium">{title}</h3>
                  <p className="flex-1 text-neutral-400">{excerpt}</p>
                </Link>
              </Card>
            );
          })}
      </div>
    </>
  );
};

export default FeaturedPosts;
