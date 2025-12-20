import { format } from "date-fns";
import { ImageResponse } from "next/og";
import { OG_SIZE } from "@/lib/og/config";
import { getOGFonts } from "@/lib/og/fonts";
import { Article } from "@/lib/og/templates/article";
import {
  getPublishedPostBySlug,
  getPublishedPostSlugs,
} from "@/lib/queries/posts";

export const alt = "Blog Post";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return new ImageResponse(<Article title="Blog Post" date="" />, {
      ...size,
      fonts: await getOGFonts(),
    });
  }

  const formattedDate = post.publishedAt
    ? format(post.publishedAt, "dd MMM yyyy")
    : "";

  const fonts = await getOGFonts();

  return new ImageResponse(
    <Article title={post.title} date={formattedDate} />,
    {
      ...size,
      fonts,
    },
  );
}

export async function generateStaticParams() {
  const posts = await getPublishedPostSlugs();
  return posts.map(({ slug }) => ({ slug }));
}
