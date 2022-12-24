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
      <div className="flex flex-col justify-center items-start max-w-4xl mx-auto mb-16">
        <div className="flex flex-col-reverse md:flex-row items-center md:items-start">
          <div className="flex flex-col basis-2/3 md:pr-8">
            <h1 className="font-bold text-3xl md:text-4xl">
              Ru Chern <span className="uppercase underline">Chong</span>
            </h1>
            <h2 className="mb-4">Developer | Investor | Author</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-16">
              Frontend developer with believe that using technology, we are able
              to change how the way we automate things to make living more
              efficient and smarter.
            </p>
          </div>
          <div className="w-[80px] sm:w-[176px] mb-8 relative cursor-pointer">
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
              className="rounded-full absolute top-0 left-0 opacity-0 hover:opacity-100"
              priority
            />
          </div>
        </div>
        <Suspense fallback={null}>
          <h3 className="font-bold text-2xl md:text-4xl mb-6">All Posts</h3>
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
