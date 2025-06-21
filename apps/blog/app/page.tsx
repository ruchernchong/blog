import Author from "@/components/Author";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/card";
import { StructuredData } from "@/components/StructuredData";
import { BASE_URL } from "@/config";
import { sortByLatest } from "@/lib/sortByLatest";
import { allPosts } from "contentlayer/generated";
import type { WebSite, WithContext } from "schema-dts";
import { format, formatISO, parseISO } from "date-fns";
import Link from "next/link";

const HomePage = async () => {
  const posts = allPosts.filter(({ isDraft }) => !isDraft).sort(sortByLatest);

  const structuredData: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ru Chern",
    url: BASE_URL,
    description:
      "Personal blog and portfolio of Ru Chern, featuring posts on software development, technology and personal projects.",
    image: [
      {
        "@type": "ImageObject",
        url: `${BASE_URL}/cover-image.png`,
        width: "1200",
        height: "630",
      },
    ],
    sameAs: [
      "https://github.com/ruchernchong",
      "https://www.linkedin.com/in/ruchernchong",
      "https://twitter.com/ruchernchong",
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div
        className="flex flex-col justify-center gap-8"
        data-umami-event="page-view"
        data-umami-event-type="home"
      >
        <div data-umami-event="author-section-view">
          <Author title="Chong Ru Chern" />
        </div>
        <div
          className="flex flex-col gap-8"
          data-umami-event="recent-posts-view"
          data-umami-event-count={posts.length}
        >
          <h2
            className="text-xl font-bold uppercase text-pink-500"
            data-umami-event="section-header-view"
            data-umami-event-section="recently-published"
          >
            Recently Published
          </h2>
          {posts.length === 0 && (
            <p className="text-center italic">
              There are no posts to display. Get started and write your first
              one!
            </p>
          )}
          <div className="grid gap-6 md:grid-cols-2">
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
        </div>
      </div>
    </>
  );
};

export default HomePage;
