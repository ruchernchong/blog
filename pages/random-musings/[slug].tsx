import { Suspense } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import Layout from "components/Layout";
import MDXComponents from "components/MDXComponents";
import StructuredData from "components/StructuredData";
import { MDXRemote } from "next-mdx-remote";
import { mdxToHtml } from "lib/mdxToHtml";
import { RandomMusing } from "lib/types";
import { HOST_URL } from "config";
import { BlogPosting, WithContext } from "schema-dts";

const RandomMusingsPage = ({ item }) => {
  const ogImageUrlParams = {
    title: item.title,
  };
  const urlParams = Object.entries(ogImageUrlParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const ogImageUrl = encodeURI(`${HOST_URL}/api/og?${urlParams}`);

  const structuredData: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: item.title,
    image: ogImageUrl,
    description: item.excerpt,
    url: `${HOST_URL}/blog/${item.slug}`,
    author: [
      {
        "@type": "Person",
        name: "Ru Chern Chong",
        url: "https://ruchern.xyz",
      },
    ],
    datePublished: item.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${HOST_URL}/random-musings`,
    },
  };

  return (
    <Layout
      title={`${item.title} - Ru Chern`}
      description="A collection containing fun and interesting things I came across randomly"
      image={ogImageUrl}
      date={item.date}
      type="article"
    >
      <StructuredData data={structuredData} />
      <article className="prose mx-auto mb-8 max-w-4xl prose-img:rounded-2xl dark:prose-invert">
        <Suspense fallback={null}>
          <MDXRemote {...item.content} components={MDXComponents} />
        </Suspense>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const items: RandomMusing[] = await fetch(
    "https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json"
  ).then((res) => res.json());

  return {
    paths: items.map(({ slug }) => ({ params: { slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const items: RandomMusing[] = await fetch(
    "https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json"
  ).then((res) => res.json());

  const item = items.find(({ slug }) => slug === params.slug);

  const mdxSource = await mdxToHtml(item.content);

  return {
    props: {
      item: {
        ...item,
        content: mdxSource,
      },
    },
  };
};

export default RandomMusingsPage;
