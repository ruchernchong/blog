import { Suspense } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import Card from "@/components/Card";
import Layout from "@/components/Layout";
import MDXComponents from "@/components/MDXComponents";
import StructuredData from "@/components/StructuredData";
import { mdxToHtml } from "@/lib/mdxToHtml";
import { postQuery, postSlugsQuery } from "@/lib/queries";
import { sanityClient } from "@/lib/sanity-server";
import { MDXRemote } from "next-mdx-remote";
import readingTime from "reading-time";
import { HOST_URL } from "@/config";
import { BlogPosting, WithContext } from "schema-dts";
import { BookOpenIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

const PostPage = ({ post }) => {
  const publishedDate = post.publishedDate;

  const formattedDate = format(parseISO(publishedDate), "dd MMMM yyyy");
  const ogImageUrlParams = {
    title: post.title,
  };
  const urlParams = Object.entries(ogImageUrlParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const ogImageUrl = encodeURI(`${HOST_URL}/api/og?${urlParams}`);

  const structuredData: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: ogImageUrl,
    description: post.excerpt,
    url: `${HOST_URL}/blog/${post.slug.current}`,
    author: [
      {
        "@type": "Person",
        name: "Ru Chern Chong",
        url: "https://ruchern.xyz",
      },
    ],
    datePublished: publishedDate,
    // TODO: Coming soon
    // mainEntityOfPage: {
    //   "@type": "WebPage",
    //   "@id": `${HOST_URL}/blog`,
    // },
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
      <article className="prose mx-auto mb-16 max-w-4xl prose-img:rounded-2xl dark:prose-invert">
        <div className="flex w-full flex-col items-center justify-center text-neutral-600 dark:text-neutral-400 md:flex-row md:items-center">
          <div className="mb-2 flex items-center">
            <CalendarDaysIcon className="mr-2 h-6 w-6" />
            <time
              dateTime={formatISO(parseISO(publishedDate))}
              title={formattedDate}
            >
              {formattedDate}
            </time>
            <div className="mx-2">&middot;</div>
            <BookOpenIcon className="mr-2 h-6 w-6" />
            <div>{post.readingTime}</div>
          </div>
        </div>
        <h1 className="text-center">{post.title}</h1>
        <Suspense fallback={null}>
          <MDXRemote {...post.mdxSource} components={MDXComponents} />
        </Suspense>
      </article>
      <div className="mb-16 grid gap-y-4 md:grid-cols-2 md:gap-x-4">
        {post.previous && (
          <Link href={post.previous.slug}>
            <Card>
              <div className="text-neutral-900 dark:text-neutral-400">
                Previous:
              </div>
              <div>{post.previous.title}</div>
            </Card>
          </Link>
        )}
        {post.next && (
          <Link href={post.next.slug}>
            <Card className="flex flex-col items-end">
              <div className="text-neutral-900 dark:text-neutral-400">
                Next:
              </div>
              <div>{post.next.title}</div>
            </Card>
          </Link>
        )}
      </div>
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
  const { post, previous, next } = await sanityClient.fetch(postQuery, {
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
        previous,
        next,
        mdxSource,
        readingTime: readingTime(post.content).text,
      },
    },
  };
};

export default PostPage;
