import { allPosts } from "contentlayer/generated";
import type { WebSite, WithContext } from "schema-dts";
import Author from "@/components/Author";
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
      <div className="flex flex-col justify-center gap-8">
        <Author title="Chong Ru Chern" />
        {featuredPosts.length > 0 && (
          <FeaturedPosts featuredPosts={featuredPosts} />
        )}
        <div className="flex flex-col gap-8">
          <h2 className="text-xl font-bold uppercase text-pink-500">
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
                  <BlogPost
                    key={title}
                    title={title}
                    url={url}
                    excerpt={excerpt}
                    publishedAt={publishedAt}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
