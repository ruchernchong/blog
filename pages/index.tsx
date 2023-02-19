import { GetStaticProps, InferGetStaticPropsType } from "next";
import Layout from "components/Layout";
import Author from "components/Author";
import BlogPost from "components/BlogPost";
import FeaturedPosts from "components/FeaturedPosts";
import { featuredPostsQuery, postsQuery } from "lib/queries";
import { sanityClient } from "lib/sanity-server";
import { Post } from "lib/types";

const Home = ({
  posts,
  featuredPosts,
}: InferGetStaticPropsType<typeof getStaticProps>) => (
  <Layout title="Ru Chern">
    <div className="mx-auto mb-8 flex max-w-4xl flex-col justify-center">
      <Author description="Developer | Investor | Author" hideTagline={true} />
      {process.env.NEXT_PUBLIC_FEATURE_FEATURED_POST === "true" && (
        <FeaturedPosts featuredPosts={featuredPosts} />
      )}
      <h2 className="mb-2 text-3xl font-bold md:text-4xl">
        All Posts{" "}
        <sup className="sups text-2xl text-neutral-600 dark:text-neutral-400">
          ({posts.length})
        </sup>
      </h2>
      <div className="mb-6 text-lg text-neutral-600 dark:text-neutral-400">
        Blog posts on mostly front-end development.
      </div>
      {posts.length === 0 && (
        <h3 className="text-center italic">
          There are no posts to display. Get started and write your first one!
        </h3>
      )}
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
  </Layout>
);

export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  const posts: Post[] = await sanityClient.fetch(postsQuery);
  const featuredPosts: Post[] = await sanityClient.fetch(featuredPostsQuery);

  return {
    props: {
      posts,
      featuredPosts,
    },
  };
};

export default Home;
