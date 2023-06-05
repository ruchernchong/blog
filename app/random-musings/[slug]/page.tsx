import MDXComponents from "@/components/MDXComponents";
import MDXRemote from "@/components/MDXRemote";
import StructuredData from "@/components/StructuredData";
import type { RandomMusing } from "@/lib/types";
import { HOST_URL } from "@/config";
import { BlogPosting, WithContext } from "schema-dts";
import { Metadata } from "next";

const RANDOM_MUSINGS_API_URL: string = `https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json`;

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const slug = params.slug;

  const item: RandomMusing = await fetch(RANDOM_MUSINGS_API_URL)
    .then((res) => res.json())
    .then((res) => res.find(({ slug }) => slug === params.slug));

  if (!item) {
    return;
  }

  const title = item.title;
  const description = item.excerpt;
  const publishedTime = new Date(item.date).toISOString();
  const url = `${HOST_URL}/random-musings/${slug}`;

  const ogImageUrlParams = { title };
  const urlParams = Object.entries(ogImageUrlParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const ogImageUrl = encodeURI(`${HOST_URL}/api/og?${urlParams}`);
  const images = [ogImageUrl];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    alternates: {
      canonical: url,
    },
  };
};

const RandomMusingsPostsPage = async ({ params }) => {
  const items: RandomMusing[] = await fetch(RANDOM_MUSINGS_API_URL).then(
    (res) => res.json()
  );

  let item = items.find(({ slug }) => slug === params.slug);

  item = {
    ...item,
    content: item.content,
  };

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
    <>
      <StructuredData data={structuredData} />
      <article className="prose prose-invert mx-auto mb-16 max-w-4xl prose-a:text-indigo-300 prose-img:rounded-2xl">
        <MDXRemote source={item.content} components={MDXComponents} />
      </article>
    </>
  );
};

export const generateStaticParams = async () => {
  const items: RandomMusing[] = await fetch(RANDOM_MUSINGS_API_URL).then(
    (res) => res.json()
  );

  return items.map(({ slug }) => ({ params: { slug } }));
};

export default RandomMusingsPostsPage;
