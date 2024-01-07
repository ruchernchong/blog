import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import Card from "@/components/Card";
import { Typography } from "@/components/Typography";
import { Post } from "contentlayer/generated";

interface FeaturedPostsProps {
  featuredPosts: Post[];
}

const FeaturedPosts = ({ featuredPosts }: FeaturedPostsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-4xl font-bold">Featured</div>
      <div className="grid auto-rows-max gap-4 md:auto-cols-fr md:grid-flow-col">
        {featuredPosts
          .slice(0, 3)
          .map(({ title, url, excerpt, publishedAt }) => {
            const formattedDate = format(
              parseISO(publishedAt),
              "iiii, dd MMMM yyyy"
            );

            return (
              <Card key={title}>
                <Link href={url} className="flex flex-col gap-2">
                  <time
                    dateTime={formatISO(parseISO(publishedAt))}
                    title={formattedDate}
                    className="italic text-gray-400"
                  >
                    {formattedDate}
                  </time>
                  <Typography variant="h2">{title}</Typography>
                  <p className="flex-1 text-gray-400">{excerpt}</p>
                </Link>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default FeaturedPosts;
