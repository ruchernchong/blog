import { Suspense } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import { format, formatISO, parseISO } from "date-fns";
import Layout from "components/Layout";
import MDXComponents from "components/MDXComponents";
import StructuredData from "components/StructuredData";
import { mdxToHtml } from "lib/mdxToHtml";
import { postQuery, postSlugsQuery } from "lib/queries";
import { sanityClient } from "lib/sanity-server";
import { MDXRemote } from "next-mdx-remote";
import readingTime from "reading-time";
import avatar from "public/avatar.jpg";
import { HOST_URL } from "config";

const PostPage = ({ post }) => {
  const publishedDate = post.publishedDate;

  const formattedDate = format(parseISO(publishedDate), "dd MMMM yyyy");
  const ogImageUrlParams = {
    title: post.title,
    date: formattedDate,
  };
  const urlParams = Object.entries(ogImageUrlParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const ogImageUrl = encodeURI(`${HOST_URL}/api/og?${urlParams}`);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: [
      {
        "@type": "Person",
        name: "Ru Chern Chong",
        url: "https://ruchern.xyz",
      },
    ],
    image: ogImageUrl,
    datePublished: publishedDate,
  };

  return (
    <Layout
      title={`${post.title} - Ru Chern`}
      description={post.excerpt}
      image={ogImageUrl}
      date={publishedDate}
      type="article"
    >
      <StructuredData data={structuredData} />
      <article className="prose mx-auto mb-6 max-w-4xl prose-img:rounded-2xl dark:prose-invert">
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
              Ru Chern Chong &middot;{" "}
              <time
                dateTime={formatISO(parseISO(publishedDate))}
                title={formattedDate}
              >
                {formattedDate}
              </time>
            </p>
          </div>
          <p className="not-prose m-0 mb-2">{post.readingTime}</p>
        </div>
        <Suspense fallback={null}>
          <MDXRemote {...post.mdxSource} components={MDXComponents} />
        </Suspense>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(postSlugsQuery);

  return {
    paths: paths.map((slug) => ({ params: { slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { post } = await sanityClient.fetch(postQuery, {
    slug: params.slug,
  });

  if (!post) {
    return {
      notFound: true,
    };
  }

  const mdxSource = await mdxToHtml(post.content);

  return {
    props: {
      post: {
        ...post,
        mdxSource,
        readingTime: readingTime(post.content).text,
      },
    },
  };
};

export default PostPage;
