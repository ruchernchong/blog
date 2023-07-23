import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import Card from "@/components/Card";
import { H2, H3 } from "@/components/Typography";
import { Post } from "@/lib/types";

interface FeaturedPostsProps {
  featuredPosts: Post[];
}

const FeaturedPosts = ({ featuredPosts }: FeaturedPostsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <H2>Featured Posts</H2>
      <div className="grid gap-4 md:grid-cols-3">
        {featuredPosts
          .slice(0, 3)
          .map(({ title, slug, excerpt, publishedDate }) => {
            const formattedDate = format(
              parseISO(publishedDate),
              "iiii, dd MMMM yyyy"
            );

            return (
              <Card key={title}>
                <Link href={`/blog/${slug}`} className="flex flex-col gap-2">
                  <time
                    dateTime={formatISO(parseISO(publishedDate))}
                    title={formattedDate}
                    className="italic text-neutral-400"
                  >
                    {formattedDate}
                  </time>
                  <H3>{title}</H3>
                  <p className="flex-1 text-neutral-400">{excerpt}</p>
                </Link>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default FeaturedPosts;
