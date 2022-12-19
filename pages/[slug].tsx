import Image from "next/image";
import Container from "../components/Container";

import avatar from "public/avatar.jpg";

export default function PostPage({ post }) {
  return (
    <Container>
      <article className="prose dark:prose-invert prose-img:rounded-2xl max-w-2xl mx-auto">
        <h1>{post.title}</h1>
        <div className="flex justify-between items-center w-full text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center">
            <Image
              src={avatar}
              width={24}
              className="not-prose mr-2"
              alt="Ru Chern Chong"
            />
            <p>{post.user.name}</p>
          </span>
          <span>{post.reading_time_minutes} min read</span>
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.body_html }} />
      </article>
    </Container>
  );
}

export async function getStaticPaths() {
  const posts = await fetch(
    "https://dev.to/api/articles?username=ruchernchong"
  ).then((res) => res.json());

  return {
    paths: posts.map(({ slug }) => ({ params: { slug } })),
    fallback: false,
  };
}
export async function getStaticProps({ params }) {
  const post = await fetch(
    `https://dev.to/api/articles/ruchernchong/${params.slug}`
  ).then((res) => res.json());

  return {
    props: {
      post,
    },
  };
}
