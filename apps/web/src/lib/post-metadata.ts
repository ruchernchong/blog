import readingTime from "reading-time";
import { SITE_NAME } from "@/config";
import type { PostMetadata } from "@/schema";
import truncate from "@/utils/truncate";

export function generatePostMetadata(
  title: string,
  slug: string,
  content: string,
  summary: string | null,
  publishedAt: Date | null,
): PostMetadata {
  const description = summary ? truncate(summary) : "";
  const postUrl = `/blog/${slug}`;
  const ogImageUrl = `/og?title=${encodeURIComponent(title)}`;
  const publishedTime = publishedAt
    ? publishedAt.toISOString()
    : new Date().toISOString();

  return {
    readingTime: readingTime(content).text,
    description,
    canonical: postUrl,
    openGraph: {
      title,
      siteName: SITE_NAME,
      description,
      type: "article",
      publishedTime,
      url: postUrl,
      images: [ogImageUrl],
      locale: "en_SG",
    },
    twitter: {
      card: "summary_large_image",
      site: "@ruchernchong",
      title,
      description,
      images: [ogImageUrl],
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      dateModified: publishedTime,
      datePublished: publishedTime,
      description,
      image: [ogImageUrl],
      url: postUrl,
      author: {
        "@type": "Person",
        name: "Ru Chern Chong",
        url: "/",
      },
    },
  };
}
