import { format, formatISO, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import Link from "next/link";
import { sortByLatest } from "@/lib/sortByLatest";
import { allPosts } from "contentlayer/generated";
import { Typography } from "@/components/Typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "My blog posts on coding, tech, and random thoughts.",
};

const BlogPage = () => {
  const posts = allPosts.filter(({ isDraft }) => !isDraft).sort(sortByLatest);

  return (
    <>
      <Typography variant="h1" className="mb-8">
        Blog
      </Typography>
      <div className="flex flex-col gap-4">
        {posts.length > 0 &&
          posts.map(({ title, canonical, excerpt, publishedAt }) => {
            const formattedDate = format(
              parseISO(publishedAt),
              "iiii, dd MMMM yyyy",
            );

            return (
              <Card
                key={title}
                data-umami-event="blog-post-view"
                data-umami-event-title={title}
              >
                <Link
                  href={canonical}
                  className="flex h-full flex-col"
                  data-umami-event="blog-post-link-click"
                  data-umami-event-title={title}
                  data-umami-event-url={canonical}
                >
                  <CardHeader>
                    <time
                      dateTime={formatISO(parseISO(publishedAt))}
                      title={formattedDate}
                      className="text-sm text-zinc-400 italic"
                      data-umami-event="blog-post-date-view"
                      data-umami-event-title={title}
                      data-umami-event-date={publishedAt}
                    >
                      {formattedDate}
                    </time>
                    <CardTitle
                      className="capitalize"
                      data-umami-event="blog-post-title-view"
                      data-umami-event-title={title}
                    >
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    data-umami-event="blog-post-excerpt-view"
                    data-umami-event-title={title}
                  >
                    {excerpt}
                  </CardContent>
                </Link>
              </Card>
            );
          })}
      </div>
    </>
  );
};

export default BlogPage;
