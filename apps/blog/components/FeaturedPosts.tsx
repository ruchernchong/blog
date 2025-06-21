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
    <div
      className="flex flex-col gap-8"
      data-umami-event="featured-posts-section-view"
    >
      <div
        className="text-xl font-bold text-pink-500 uppercase"
        data-umami-event="featured-posts-header-view"
      >
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
              <Card
                key={title}
                data-umami-event="featured-post-card-interaction"
                data-umami-event-title={title}
              >
                <Link
                  href={canonical}
                  className="flex h-full flex-col"
                  data-umami-event="featured-post-link-click"
                  data-umami-event-title={title}
                  data-umami-event-url={canonical}
                >
                  <CardHeader>
                    <time
                      dateTime={formatISO(parseISO(publishedAt))}
                      title={formattedDate}
                      className="text-sm text-zinc-400 italic"
                      data-umami-event="featured-post-date-view"
                      data-umami-event-title={title}
                      data-umami-event-date={publishedAt}
                    >
                      {formattedDate}
                    </time>
                    <CardTitle
                      className="capitalize"
                      data-umami-event="featured-post-title-view"
                      data-umami-event-title={title}
                    >
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    data-umami-event="featured-post-excerpt-view"
                    data-umami-event-title={title}
                  >
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
