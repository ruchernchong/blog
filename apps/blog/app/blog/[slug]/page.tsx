import { Mdx } from "@/components/Mdx";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import StatsBar from "@/components/StatsBar";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { allPosts } from "contentlayer/generated";
import { format, formatISO, parseISO } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Params = Promise<{ slug: string }>;

export const generateMetadata = async (props: {
  params: Params;
}): Promise<Metadata> => {
  const params = await props.params;
  const post = allPosts
    .filter(({ isDraft }) => !isDraft)
    .find((post) => post.slug === params.slug);

  if (!post) {
    notFound();
  }

  const { title, description, openGraph, twitter, canonical } = post;
  return {
    title,
    description,
    openGraph,
    twitter,
    alternates: {
      canonical,
    },
  };
};

export const generateStaticParams = () =>
  allPosts.filter(({ isDraft }) => !isDraft).map(({ slug }) => ({ slug }));

const PostPage = async (props: { params: Params }) => {
  const params = await props.params;
  const post = allPosts
    .filter(({ isDraft }) => !isDraft)
    .find((post) => post.slug === params.slug);

  if (!post) {
    return notFound();
  }

  const formattedDate = format(parseISO(post.publishedAt), "dd MMM yyyy");

  return (
    <>
      <StructuredData data={post.structuredData} />
      <article className="prose prose-invert prose-a:text-pink-500 prose-img:rounded-2xl mx-auto mb-16 max-w-4xl">
        <div className="flex flex-col items-center gap-y-4 text-center">
          <StatsBar slug={post.slug} />
          <div className="flex gap-x-2 text-zinc-400 md:flex-row">
            <div className="flex items-center justify-center gap-x-2">
              <CalendarDaysIcon className="h-6 w-6" />
              <time
                dateTime={formatISO(parseISO(post.publishedAt))}
                title={formattedDate}
              >
                {formattedDate}
              </time>
            </div>
            <div className="flex items-center justify-center gap-x-2">
              <span>&middot;</span>
              <BookOpenIcon className="h-6 w-6" />
              <div>{post.readingTime}</div>
            </div>
          </div>
          <Typography variant="h1">{post.title}</Typography>
        </div>
        <aside className="relative rounded-md border-l-4 border-l-pink-500 bg-zinc-800 p-6">
          <div className="absolute top-0 left-0 -translate-x-[50%] -translate-y-[50%] rounded-full bg-zinc-900 p-2 text-pink-500">
            <InformationCircleIcon width={32} height={32} />
          </div>
          {post.excerpt}
        </aside>
        <div>
          <Mdx code={post.body.code} />
        </div>
      </article>
    </>
  );
};

export default PostPage;
