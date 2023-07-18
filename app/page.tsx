import Author from "@/components/Author";
import BlogPost from "@/components/BlogPost";
import FeaturedPosts from "@/components/FeaturedPosts";
import StructuredData from "@/components/StructuredData";
import { featuredPostsQuery, postsQuery } from "@/lib/queries";
import { sanityClient } from "@/lib/sanity-server";
import { Post } from "@/lib/types";
import { WebSite, WithContext } from "schema-dts";
import { HOST_URL } from "@/config";

const HomePage = async () => {
  const posts: Post[] = await sanityClient.fetch(postsQuery);
  const featuredPosts: Post[] = await sanityClient.fetch(featuredPostsQuery);

  const structuredData: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ru Chern",
    url: `${HOST_URL}`,
    sameAs: [
      "https://github.com/ruchernchong",
      "https://www.linkedin.com/in/ruchernchong/",
      "https://twitter.com/ruchernchong",
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="mx-auto flex max-w-4xl flex-col justify-center">
        <Author title="Ru Chern" description="Developer" hideTagline={true} />
        {featuredPosts.length > 0 && (
          <FeaturedPosts featuredPosts={featuredPosts} />
        )}
        <h2 className="mb-2 text-3xl font-bold md:text-4xl">Recent Posts</h2>
        <div className="mb-16">
          <div className="text-lg">
            Blog posts on mostly front-end development.
          </div>
          <em>
            To date, I have written&nbsp;
            <span className="text-xl font-extrabold text-indigo-300">
              {posts.length}
            </span>
            &nbsp;posts and counting...
          </em>
        </div>
        {posts.length === 0 && (
          <h3 className="text-center italic">
            There are no posts to display. Get started and write your first one!
          </h3>
        )}
        <div className="flex max-w-4xl flex-col space-y-16">
          {posts.length > 0 &&
            posts.map(({ title, slug, excerpt, publishedDate }) => {
              return (
                <BlogPost
                  key={title}
                  title={title}
                  slug={`/blog/${slug}`}
                  excerpt={excerpt}
                  publishedDate={publishedDate}
                />
              );
            })}
        </div>
      </div>
    </>
  );
};

export default HomePage;
