import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import rehypeShiki from "@shikijs/rehype";
import type { MDXComponents } from "mdx/types";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import { Suspense } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkUnwrapImages from "remark-unwrap-images";
import { Typography } from "@/components/typography";
import { Mermaid } from "./mermaid";
import { remarkMermaid } from "./remark-mermaid";

interface CustomLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}

const CustomLink = ({ href, children, ...props }: CustomLinkProps) => {
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));

  if (isInternalLink) {
    return (
      <Link
        href={href as Route}
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
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          size={8}
          strokeWidth={2}
          className="inline-flex align-super"
        />
      </span>
    </a>
  );
};

interface ImageComponentProps
  extends Omit<React.ComponentProps<typeof Image>, "alt"> {
  alt: string;
}

const ImageComponent = ({ alt = "", ...props }: ImageComponentProps) => (
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
      <figcaption className="text-center font-bold text-muted-foreground text-xs italic">
        {alt}
      </figcaption>
    )}
  </figure>
);

const components: MDXComponents = {
  a: CustomLink,
  h1: (props) => <Typography variant="h1" {...props} />,
  h2: (props) => (
    <Typography variant="h2" className="text-3xl text-primary" {...props} />
  ),
  h3: (props) => <Typography variant="h3" className="text-2xl" {...props} />,
  img: ImageComponent,
  Mermaid,
};

export const Mdx = async ({ content }: { content: string }) => {
  const { content: mdxContent } = await compileMDX({
    source: content,
    components,
    options: {
      parseFrontmatter: false, // We use database fields instead of frontmatter
      mdxOptions: {
        remarkPlugins: [remarkMermaid, remarkGfm, remarkUnwrapImages],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeShiki,
            {
              theme: "nord",
            },
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
