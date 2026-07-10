import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedPostBySlug,
  getPublishedPostSlugs,
} from "@/lib/queries/posts";
import { PostArticle } from "./components/post-article";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getPost = async (slug: string) => {
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return;
  }

  // Return post with images removed from metadata (using generated OG images instead)
  return {
    ...post,
    metadata: {
      ...post.metadata,
      openGraph: { ...post.metadata.openGraph },
      twitter: { ...post.metadata.twitter },
    },
  };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

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
}

export async function generateStaticParams() {
  const publishedPosts = await getPublishedPostSlugs();
  return publishedPosts.map(({ slug }) => ({ slug }));
}

export default function PostPage({ params }: PageProps) {
  return <PostArticle params={params} />;
}
