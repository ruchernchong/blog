import { Suspense } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import { NextRouter, useRouter } from "next/router";
import classNames from "classnames";
import { format, formatISO, parseISO } from "date-fns";
import Card from "@/components/Card";
import Layout from "@/components/Layout";
import MDXComponents from "@/components/MDXComponents";
import StructuredData from "@/components/StructuredData";
import ViewCounter from "@/components/ViewCounter";
import { mdxToHtml } from "@/lib/mdxToHtml";
import { postQuery, postSlugsQuery } from "@/lib/queries";
import { sanityClient } from "@/lib/sanity-server";
import { Post } from "@/lib/types";
import { MDXRemote } from "next-mdx-remote";
import readingTime from "reading-time";
import { HOST_URL } from "@/config";
import { BlogPosting, WithContext } from "schema-dts";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface WithRouterProps {
  router: NextRouter;
}

interface PostPageProps extends WithRouterProps {
  post: Post;
}

const PostPage = ({ post }: PostPageProps) => {
  const router = useRouter();
  const publishedDate = post.publishedDate;
  const previousPost = post.previous;
  const nextPost = post.next;

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
    url: `${HOST_URL}/blog/${post.slug}`,
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
        <div className="mb-4 flex flex-col items-center justify-center text-neutral-600 dark:text-neutral-400 md:flex-row">
          <div className="flex flex-col md:flex-row">
            <div className="flex items-center justify-center">
              <CalendarDaysIcon className="mr-2 h-6 w-6" />
              <time
                dateTime={formatISO(parseISO(publishedDate))}
                title={formattedDate}
              >
                {formattedDate}
              </time>
            </div>
            <div className="flex items-center justify-center">
              <div className="mx-2 hidden md:block">&middot;</div>
              <BookOpenIcon className="mr-2 h-6 w-6" />
              <div>{post.readingTime}</div>
              <div className="mx-2">&middot;</div>
              <EyeIcon className="mr-2 h-6 w-6" />
              <ViewCounter slug={post.slug} />
            </div>
          </div>
        </div>
        <h1 className="text-center">{post.title}</h1>
        <Suspense fallback={null}>
          <MDXRemote {...post.mdxSource} components={MDXComponents} />
        </Suspense>
      </article>
      <div className="mb-16 grid gap-y-4 md:grid-cols-2 md:gap-x-4">
        <Card
          className={classNames(
            "flex cursor-pointer flex-col items-start text-left",
            {
              "pointer-events-none opacity-0": !previousPost,
              "opacity-100": previousPost,
            }
          )}
          onClick={() => router.push(previousPost?.slug)}
        >
          <div className="text-neutral-900 dark:text-neutral-400">
            Previous:
          </div>
          <div>{previousPost?.title}</div>
        </Card>
        <Card
          className={classNames(
            "flex cursor-pointer flex-col items-end text-right",
            {
              "pointer-events-none opacity-0": !nextPost,
              "opacity-100": nextPost,
            }
          )}
          onClick={() => router.push(nextPost?.slug)}
        >
          <div className="text-neutral-900 dark:text-neutral-400">Next:</div>
          <div>{nextPost?.title}</div>
        </Card>
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
