import {
  BookOpenIcon,
  CalendarDaysIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { format, formatISO } from "date-fns";
import { and, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, cacheSignal } from "react";
import { StructuredData } from "@/app/(blog)/_components/structured-data";
import StatsBar from "@/app/(blog)/analytics/_components/stats-bar";
import { Mdx } from "@/app/(blog)/blog/_components/mdx";
import { RelatedPosts } from "@/app/(blog)/blog/_components/related-posts";
import { Typography } from "@/components/shared/typography";
import { db, posts, user } from "@/schema";

type Params = Promise<{ slug: string }>;

// Cached post fetching with cacheSignal for cleanup
const getPost = cache(async (slug: string) => {
  const signal = cacheSignal();

  // Pass signal to database query for cleanup on cache expiration
  const [post] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      summary: posts.summary,
      metadata: posts.metadata,
      content: posts.content,
      status: posts.status,
      tags: posts.tags,
      featured: posts.featured,
      coverImage: posts.coverImage,
      authorId: posts.authorId,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      deletedAt: posts.deletedAt,
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(posts.slug, slug),
        eq(posts.status, "published"),
        isNull(posts.deletedAt),
      ),
    )
    .limit(1);

  // Listen for cache expiration to perform cleanup if needed
  if (signal) {
    signal.addEventListener("abort", () => {
      // Cache lifetime ended - cleanup resources if needed
      console.log(`[cacheSignal] Cache expired for post: ${slug}`);
    });
  }

  return post;
});

export const generateMetadata = async (props: {
  params: Params;
}): Promise<Metadata> => {
  const params = await props.params;
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return {
    title: post.title,
    description: post.metadata.description,
    openGraph: post.metadata.openGraph,
    twitter: post.metadata.twitter,
    alternates: {
      canonical: post.metadata.canonical,
    },
  };
};

export const generateStaticParams = async () => {
  const publishedPosts = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(and(eq(posts.status, "published"), isNull(posts.deletedAt)));

  return publishedPosts.map(({ slug }) => ({ slug }));
};

const PostPage = async (props: { params: Params }) => {
  const params = await props.params;
  // Use cached getPost - deduplicates with generateMetadata call
  const post = await getPost(params.slug);

  if (!post || !post.publishedAt) {
    return notFound();
  }

  const formattedDate = format(post.publishedAt, "dd MMM yyyy");

  return (
    <>
      <StructuredData data={post.metadata.structuredData} />
      <article className="prose prose-invert mx-auto mb-16 max-w-4xl prose-img:rounded-2xl prose-a:text-pink-500">
        <div className="flex flex-col items-center gap-y-4 text-center">
          <StatsBar slug={post.slug} />
          <div className="flex gap-x-2 text-zinc-400 md:flex-row">
            <div className="flex items-center justify-center gap-x-2">
              <CalendarDaysIcon className="h-6 w-6" />
              <time
                dateTime={formatISO(post.publishedAt)}
                title={formattedDate}
              >
                {formattedDate}
              </time>
            </div>
            <div className="flex items-center justify-center gap-x-2">
              <span>&middot;</span>
              <BookOpenIcon className="h-6 w-6" />
              <div>{post.metadata.readingTime}</div>
            </div>
            {post.author && (
              <div className="flex items-center justify-center gap-x-2">
                <span>&middot;</span>
                <span>By {post.author.name}</span>
              </div>
            )}
          </div>
          <Typography variant="h1">{post.title}</Typography>
        </div>
        <aside className="relative rounded-md border-l-4 border-l-pink-500 bg-zinc-800 p-6">
          <div className="-translate-x-[50%] -translate-y-[50%] absolute top-0 left-0 rounded-full bg-zinc-900 p-2 text-pink-500">
            <InformationCircleIcon width={32} height={32} />
          </div>
          {post.summary}
        </aside>
        <div>
          <Mdx content={post.content} />
        </div>
        <RelatedPosts slug={post.slug} />
      </article>
    </>
  );
};

export default PostPage;
