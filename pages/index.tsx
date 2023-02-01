import { GetStaticProps, InferGetStaticPropsType } from "next";

import Layout from "components/Layout";
import Author from "components/Author";
import BlogPost from "components/BlogPost";

import { indexQuery } from "lib/queries";
import { sanityClient } from "lib/sanity-server";
import { Post } from "lib/types";

const Home = ({ posts }: InferGetStaticPropsType<typeof getStaticProps>) => (
  <Layout title="Ru Chern">
    <div className="mx-auto mb-8 flex max-w-4xl flex-col items-start justify-center">
      <Author description="Developer | Investor | Author" hideTagline={true} />
      <h2 className="mb-6 text-3xl font-bold md:text-4xl">
        All Posts{" "}
        <sup className="sups text-2xl text-neutral-600 dark:text-neutral-400">
          ({posts.length})
        </sup>
      </h2>
      {posts.map(({ title, slug, excerpt, publishedDate }) => {
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
  const posts: Post[] = await sanityClient.fetch(indexQuery);

  return {
    props: {
      posts
    }
  };
};

export default Home;
