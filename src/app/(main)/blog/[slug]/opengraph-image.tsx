import { format } from "date-fns";
import { cacheLife, cacheTag } from "next/cache";
import { ImageResponse } from "next/og";
import { OG_SIZE } from "@/lib/og/config";
import { getOGFonts } from "@/lib/og/fonts";
import { Article } from "@/lib/og/templates/article";
import {
  getPublishedPostBySlug,
  getPublishedPostSlugs,
} from "@/lib/queries/posts";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export const alt = "Blog Post";
export const size = OG_SIZE;
export const contentType = "image/png";

async function getMetadata(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(`posts:${slug}`);

  const [post, fonts] = await Promise.all([
    getPublishedPostBySlug(slug),
    getOGFonts(),
  ]);

  const title = post?.title ?? "Blog Post";
  const formattedDate = post?.publishedAt
    ? format(post.publishedAt, "dd MMM yyyy")
    : "";

  return { title, formattedDate, fonts };
}

export async function generateStaticParams() {
  const posts = await getPublishedPostSlugs();
  return posts.map(({ slug }) => ({ slug }));
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const { title, formattedDate, fonts } = await getMetadata(slug);

  return new ImageResponse(<Article title={title} date={formattedDate} />, {
    ...size,
    fonts,
  });
}
