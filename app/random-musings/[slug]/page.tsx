import MDXComponents from "@/components/MDXComponents";
import MDXRemote from "@/components/MDXRemote";
import StructuredData from "@/components/StructuredData";
import { RandomMusing } from "@/lib/types";
import { HOST_URL } from "@/config";
import { BlogPosting, WithContext } from "schema-dts";

const RANDOM_MUSINGS_API_URL: string = `https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json`;

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
      <article className="prose mx-auto mb-16 max-w-4xl prose-img:rounded-2xl dark:prose-invert">
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
