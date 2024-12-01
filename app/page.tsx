import { allPosts } from "contentlayer/generated";
import type { WebSite, WithContext } from "schema-dts";
import { Author } from "@/components/Author";
import BlogPost from "@/components/BlogPost";
import FeaturedPosts from "@/components/FeaturedPosts";
import { StructuredData } from "@/components/StructuredData";
import { sortByLatest } from "@/lib/sortByLatest";
import { BASE_URL } from "@/config";

const HomePage = async () => {
  const posts = allPosts.sort(sortByLatest);
  const featuredPosts = posts.filter(({ featured }) => featured);

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
        {featuredPosts.length > 0 && (
          <div
            data-umami-event="featured-posts-view"
            data-umami-event-count={featuredPosts.length}
          >
            <FeaturedPosts featuredPosts={featuredPosts} />
          </div>
        )}
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
          <div className="flex flex-col gap-12">
            {posts.length > 0 &&
              posts.map(({ title, url, excerpt, publishedAt }) => {
                return (
                  <div
                    key={title}
                    data-umami-event="blog-post-view"
                    data-umami-event-title={title}
                  >
                    <BlogPost
                      title={title}
                      url={url}
                      excerpt={excerpt}
                      publishedAt={publishedAt}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
