import { allPosts } from "contentlayer/generated";
import { WebSite, WithContext } from "schema-dts";
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
    url: `${BASE_URL}`,
    sameAs: [
      "https://github.com/ruchernchong",
      "https://www.linkedin.com/in/ruchernchong/",
      "https://x.com/ruchernchong",
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col justify-center gap-8">
        <Author title="Ru Chern" />
        {featuredPosts.length > 0 && (
          <FeaturedPosts featuredPosts={featuredPosts} />
        )}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="text-4xl font-bold">Recent Posts</div>
            <div className="text-neutral-400">
              <div>Blog posts on mostly front-end development.</div>
              <em>
                To date, I have written&nbsp;
                <span className="text-xl font-extrabold text-indigo-300">
                  {posts.length}
                </span>
                &nbsp;posts and counting...
              </em>
            </div>
          </div>
          <div>
            {posts.length === 0 && (
              <p className="text-center italic">
                There are no posts to display. Get started and write your first
                one!
              </p>
            )}
            <div className="flex flex-col gap-12">
              {posts.length > 0 &&
                posts.map(({ title, slug, excerpt, publishedAt }) => {
                  return (
                    <BlogPost
                      key={title}
                      title={title}
                      slug={slug}
                      excerpt={excerpt}
                      publishedAt={publishedAt}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
