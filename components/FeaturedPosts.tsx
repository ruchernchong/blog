import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import Card from "@/components/Card";
import { Typography } from "@/components/Typography";
import type { Post } from "contentlayer/generated";

interface FeaturedPostsProps {
  featuredPosts: Post[];
}

const FeaturedPosts = ({ featuredPosts }: FeaturedPostsProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-xl font-bold uppercase text-pink-500">
        Featured Posts
      </div>
      <div className="grid gap-4 md:auto-cols-fr md:grid-flow-col">
        {featuredPosts
          .slice(0, 3)
          .map(({ title, url, excerpt, publishedAt }) => {
            const formattedDate = format(
              parseISO(publishedAt),
              "iiii, dd MMMM yyyy"
            );

            return (
              <Card key={title}>
                <Link href={url} className="flex h-full flex-col gap-2">
                  <time
                    dateTime={formatISO(parseISO(publishedAt))}
                    title={formattedDate}
                    className="italic text-gray-400"
                  >
                    {formattedDate}
                  </time>
                  <Typography
                    variant="h3"
                    className="flex grow flex-col justify-center capitalize"
                  >
                    {title}
                  </Typography>
                  <p className="text-gray-400">{excerpt}</p>
                </Link>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default FeaturedPosts;
