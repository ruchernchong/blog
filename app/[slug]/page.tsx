import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allPosts, Post } from "contentlayer/generated";
import classNames from "classnames";
import { format, formatISO, parseISO } from "date-fns";
import Card from "@/components/Card";
import { Mdx } from "@/components/Mdx";
import { StructuredData } from "@/components/StructuredData";
import { H1 } from "@/components/Typography";
import ViewCounter from "@/components/ViewCounter";
import { BASE_URL } from "@/config";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import "@code-hike/mdx/dist/index.css";

export const generateMetadata = async ({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> => {
  const post = allPosts.find((post) => post.slug === params.slug);

  if (!post) {
    return notFound();
  }

  const title = post.title;
  const description = post.excerpt;
  const publishedTime = post.publishedAt;
  const url = `${BASE_URL}/${post.slug}`;
  const ogImageUrl = `${BASE_URL}/og?title=${post.title}`;
  const images = [ogImageUrl];

  return {
    title,
    description,
    authors: {
      name: "Ru Chern Chong",
      url: BASE_URL,
    },
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

const PostPage = ({ params }: { params: { slug: string } }) => {
  const post = allPosts.find((post) => post._raw.flattenedPath === params.slug);

  if (!post) {
    return notFound();
  }

  // post = {
  //   ...post,
  //   previous,
  //   next,
  //   readingTime: readingTime(post.content).text,
  // };

  // const publishedDate = post.publishedDate;
  // const previousPost = post.previous;
  // const nextPost = post.next;

  const formattedDate = format(parseISO(post.publishedAt), "dd MMMM yyyy");

  return (
    <>
      <StructuredData data={post.structuredData} />
      <article className="prose prose-invert mx-auto mb-16 max-w-4xl prose-a:text-pink-500 prose-img:rounded-2xl">
        <div className="mb-4 flex flex-col items-center justify-center text-gray-400 md:flex-row">
          <div className="flex flex-col md:flex-row">
            <div className="flex items-center justify-center">
              <CalendarDaysIcon className="mr-2 h-6 w-6" />
              <time
                dateTime={formatISO(parseISO(post.publishedAt))}
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
        <H1 className="text-center">{post.title}</H1>
        <Mdx code={post.body.code} />
      </article>
      {/*<div className="mb-16 grid gap-y-4 md:grid-cols-2 md:gap-x-4">*/}
      {/*  <Link href={`/blog/${previousPost?.slug}`}>*/}
      {/*    <Card*/}
      {/*      className={classNames(*/}
      {/*        "flex cursor-pointer flex-col items-start text-left",*/}
      {/*        {*/}
      {/*          "pointer-events-none opacity-0": !previousPost,*/}
      {/*          "opacity-100": previousPost,*/}
      {/*        }*/}
      {/*      )}*/}
      {/*    >*/}
      {/*      <div className="text-gray-400">Previous:</div>*/}
      {/*      <div>{previousPost?.title}</div>*/}
      {/*    </Card>*/}
      {/*  </Link>*/}
      {/*  <Link href={`/blog/${nextPost?.slug}`}>*/}
      {/*    <Card*/}
      {/*      className={classNames(*/}
      {/*        "flex cursor-pointer flex-col items-end text-right",*/}
      {/*        {*/}
      {/*          "pointer-events-none opacity-0": !nextPost,*/}
      {/*          "opacity-100": nextPost,*/}
      {/*        }*/}
      {/*      )}*/}
      {/*    >*/}
      {/*      <div className="text-gray-400">Next:</div>*/}
      {/*      <div>{nextPost?.title}</div>*/}
      {/*    </Card>*/}
      {/*  </Link>*/}
      {/*</div>*/}
    </>
  );
};

export default PostPage;
