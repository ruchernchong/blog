import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/card";
import type { Post } from "contentlayer/generated";
import { format, formatISO, parseISO } from "date-fns";
import Link from "next/link";

interface FeaturedPostsProps {
  featuredPosts: Post[];
}

const FeaturedPosts = ({ featuredPosts }: FeaturedPostsProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-xl font-bold text-pink-500 uppercase">
        Featured Posts
      </div>
      <div className="grid gap-4 md:auto-cols-fr md:grid-flow-col">
        {featuredPosts
          .slice(0, 3)
          .map(({ title, canonical, excerpt, publishedAt }) => {
            const formattedDate = format(
              parseISO(publishedAt),
              "iiii, dd MMMM yyyy",
            );

            return (
              <Card key={title}>
                <Link
                  href={canonical}
                  className="flex h-full flex-col"
                >
                  <CardHeader>
                    <time
                      dateTime={formatISO(parseISO(publishedAt))}
                      title={formattedDate}
                      className="text-sm text-zinc-400 italic"
                    >
                      {formattedDate}
                    </time>
                    <CardTitle className="capitalize">
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {excerpt}
                  </CardContent>
                </Link>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default FeaturedPosts;
