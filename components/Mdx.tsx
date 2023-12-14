"use client";

import Link from "next/link";
import Image from "next/image";
import { useMDXComponent } from "next-contentlayer/hooks";
import type { MDXComponents } from "mdx/types";
import { CH } from "@code-hike/mdx/components";
import { Typography } from "@/components/Typography";

const CustomLink = ({ href, children, ...props }: any) => {
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));

  if (isInternalLink) {
    return (
      <Link href={href} scroll={false} className="text-pink-500" {...props}>
        {children}
      </Link>
    );
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

const ImageComponent = ({ alt, ...props }: any) => (
  <Image
    alt={alt}
    width={0}
    height={0}
    sizes="100vw"
    className="h-auto w-auto rounded-2xl"
    {...props}
  />
);

const components: MDXComponents = {
  CH,
  a: CustomLink,
  h1: () => <Typography variant="h1" />,
  h2: () => <Typography variant="h2" />,
  h3: () => <Typography variant="h3" />,
  img: ImageComponent,
};

export const Mdx = ({ code }: { code: string }) => {
  const Component = useMDXComponent(code);

  return <Component components={components} />;
};
