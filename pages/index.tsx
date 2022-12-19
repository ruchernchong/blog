import { Suspense } from "react";
import Image from "next/image";
import { Inter } from "@next/font/google";

import Container from "components/Container";

import { InferGetStaticPropsType } from "next";
import { Post } from "lib/types";

import avatar from "public/avatar.jpg";
import BlogPost from "../components/BlogPost";

const inter = Inter({ subsets: ["latin"] });

export default function Home({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Container title="Blog - Ru Chern">
      <div className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16">
        <div className="flex flex-col-reverse sm:flex-row items-start">
          <div className="flex flex-col pr-8">
            <h1 className="font-bold text-3xl md:text-4xl mb-16">
              Ru Chern <span className="uppercase underline">Chong</span>
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-16">
              Frontend developer with believe that using technology, we are able
              to change how the way we automate things to make living more
              efficient and smarter.
            </p>
          </div>
          <div className="w-[80px] sm:w-[176px]">
            <Image
              src={avatar}
              sizes="33vw"
              width={176}
              alt="Ru Chern Chong"
              className="rounded-full"
              priority
            />
          </div>
        </div>
        <Suspense fallback={null}>
          <div className="">
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
          </div>
        </Suspense>
      </div>
    </Container>
  );
}

export const getStaticProps = async () => {
  const posts: Post[] = await fetch(
    "https://dev.to/api/articles?username=ruchernchong"
  ).then((res) => res.json());

  return {
    props: {
      posts,
    },
  };
};
