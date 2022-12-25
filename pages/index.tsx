import { Suspense } from "react";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Image from "next/image";

import BlogPost from "components/BlogPost";
import Container from "components/Container";

import { Post } from "lib/types";

import avatar from "public/avatar.jpg";
import avatarHover from "public/avatar-hover.jpg";

export default function Home({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Container title="Home - Ru Chern">
      <div className="mx-auto mb-16 flex max-w-4xl flex-col items-start justify-center">
        <div className="flex flex-col-reverse items-center md:flex-row md:items-start">
          <div className="flex basis-2/3 flex-col md:pr-8">
            <h1 className="text-3xl font-bold md:text-4xl">
              Ru Chern <span className="uppercase underline">Chong</span>
            </h1>
            <h2 className="mb-4">Developer | Investor | Author</h2>
            <p className="mb-16 text-neutral-600 dark:text-neutral-400">
              Frontend developer with believe that using technology, we are able
              to change how the way we automate things to make living more
              efficient and smarter.
            </p>
          </div>
          <div className="relative mb-8 w-[80px] cursor-pointer sm:w-[176px]">
            <Image
              src={avatar}
              sizes="33vw"
              width={176}
              alt="Ru Chern Chong"
              className="rounded-full opacity-100 hover:opacity-0"
              priority
            />
            <Image
              src={avatarHover}
              sizes="33vw"
              width={176}
              alt="Ru Chern Chong"
              className="absolute top-0 left-0 rounded-full opacity-0 hover:opacity-100"
              priority
            />
          </div>
        </div>
        <Suspense fallback={null}>
          <h3 className="mb-6 text-2xl font-bold md:text-4xl">All Posts</h3>
          {posts.map(({ description, slug, title }) => {
            return (
              <BlogPost
                key={title}
                description={description}
                slug={slug}
                title={title}
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
