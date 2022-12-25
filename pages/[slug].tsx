import { Suspense } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import Container from "components/Container";
import { DEV_TO_USERNAME } from "lib/config";
import { Post } from "lib/types";
import avatar from "public/avatar.jpg";

export default function PostPage({ post }) {
  return (
    <Container
      title={`${post.title} - Ru Chern`}
      description={post.description}
      image={post.social_image}
      date={post.published_at}
      type="article"
    >
      <article className="prose mx-auto max-w-4xl prose-img:rounded-2xl dark:prose-invert">
        <h1>{post.title}</h1>
        <div className="flex w-full flex-col items-start justify-between text-neutral-600 dark:text-neutral-400 md:flex-row md:items-center">
          <div className="mb-2 flex items-center">
            <Image
              src={avatar}
              width={24}
              className="not-prose m-0 mr-2"
              alt="Ru Chern Chong"
              priority
            />
            <p className="not-prose m-0">
              {post.user.name} &middot;{" "}
              {format(parseISO(post.published_at), "dd MMMM yyyy")}
            </p>
          </div>
          <p className="not-prose m-0 mb-2">
            {post.reading_time_minutes} min read
          </p>
        </div>
        <Suspense fallback={null}>
          <div dangerouslySetInnerHTML={{ __html: post.body_html }} />
        </Suspense>
      </article>
    </Container>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts: Post[] = await fetch("https://dev.to/api/articles/me", {
    headers: {
      "api-key": process.env.DEV_TO_API_KEY,
    },
  }).then((res) => res.json());

  return {
    paths: posts.map(({ slug }) => ({ params: { slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const res = await fetch(
    `https://dev.to/api/articles/${DEV_TO_USERNAME}/${params.slug}`
  );
  const post: Post = await res.json();

  if (!res.ok) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },
  };
};
