import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import { Suspense } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkUnwrapImages from "remark-unwrap-images";
import { Typography } from "@/components/shared/typography";

const CustomLink = ({ href, children, ...props }: any) => {
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));

  if (isInternalLink) {
    return (
      <Link
        href={href}
        className="text-foreground underline hover:text-muted-foreground"
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-foreground underline hover:text-muted-foreground"
      {...props}
    >
      <span>
        {children}
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} className="inline-flex align-super" />
      </span>
    </a>
  );
};

const ImageComponent = ({ alt, ...props }: any) => (
  <figure>
    <Suspense fallback={null}>
      <Image
        alt={alt}
        width={0}
        height={0}
        sizes="100vw"
        className="h-auto w-full rounded-2xl"
        {...props}
      />
    </Suspense>
    {alt && (
      <figcaption className="text-center font-bold text-xs text-muted-foreground italic">
        {alt}
      </figcaption>
    )}
  </figure>
);

const components: MDXComponents = {
  a: CustomLink,
  h1: (props) => <Typography variant="h1" {...props} />,
  h2: (props) => (
    <Typography
      variant="h2"
      className="mt-24 text-3xl text-primary"
      {...props}
    />
  ),
  h3: (props) => (
    <Typography variant="h3" className="mt-16 text-2xl" {...props} />
  ),
  img: ImageComponent,
};

export const Mdx = async ({ content }: { content: string }) => {
  const { content: mdxContent } = await compileMDX({
    source: content,
    components,
    options: {
      parseFrontmatter: false, // We use database fields instead of frontmatter
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkUnwrapImages],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypePrettyCode,
            {
              theme: "github-light",
            } satisfies PrettyCodeOptions,
          ],
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: {
                className: ["permalink"],
              },
            },
          ],
        ],
      },
    },
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>{mdxContent}</div>
    </Suspense>
  );
};
