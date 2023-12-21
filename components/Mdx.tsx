"use client";

import Link from "next/link";
import Image from "next/image";
import { useMDXComponent } from "next-contentlayer/hooks";
import type { MDXComponents } from "mdx/types";
import { CH } from "@code-hike/mdx/components";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import { Typography } from "@/components/Typography";
import "@code-hike/mdx/dist/index.css";

const CustomLink = ({ href, children, ...props }: any) => {
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));

  if (isInternalLink) {
    return (
      <Link
        href={href}
        scroll={false}
        className="text-pink-500 hover:text-pink-300"
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
      rel="noopener noreferrer"
      className="inline-flex text-pink-500 hover:text-pink-300"
      {...props}
    >
      <span>{children}</span>
      <ArrowTopRightOnSquareIcon width={16} height={16} />
    </a>
  );
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
  h1: (props) => <Typography variant="h1" {...props} />,
  h2: (props) => <Typography variant="h2" {...props} />,
  h3: (props) => <Typography variant="h3" {...props} />,
  img: ImageComponent,
};

export const Mdx = ({ code }: { code: string }) => {
  const Component = useMDXComponent(code);

  return <Component components={components} />;
};
