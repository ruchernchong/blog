import { Suspense } from "react";
import { GetStaticProps, InferGetStaticPropsType } from "next";

import Container from "components/Container";
import Author from "components/Author";
import BlogPost from "components/BlogPost";

import { Post } from "lib/types";

export default function Home({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Container title="Ru Chern">
      <div className="mx-auto mb-16 flex max-w-4xl flex-col items-start justify-center">
        <Author
          description="Developer | Investor | Author"
          hideTagline={true}
        />
        <Suspense fallback={null}>
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">
            All Posts{" "}
            <sup className="sups text-2xl text-neutral-600 dark:text-neutral-400">
              ({posts.length})
            </sup>
          </h2>
          {posts.map(({ title, slug, description, published_at }) => {
            return (
              <BlogPost
                key={title}
                title={title}
                slug={slug}
                description={description}
                publishedAt={published_at}
              />
            );
          })}
        </Suspense>
      </div>
    </Container>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const posts: Post[] = await fetch("https://dev.to/api/articles/me", {
    headers: {
      "api-key": process.env.DEV_TO_API_KEY,
    },
  }).then((res) => res.json());

  return {
    props: {
      posts,
    },
  };
};
