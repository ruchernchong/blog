"use client";

import Link from "next/link";
import Image from "next/image";
import { CH } from "@code-hike/mdx/components";
import { H1, H2, H3 } from "@/components/Typography";

const CustomLink = (props) => {
  const href = props.href;
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));

  if (isInternalLink) {
    return (
      <Link href={href} scroll={false} className="text-indigo-300" {...props}>
        {props.children}
      </Link>
    );
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

const ImageComponent = (props) => (
  <Image
    alt={props.alt}
    width={0}
    height={0}
    sizes="100vw"
    className="h-auto w-auto rounded-2xl"
    {...props}
  />
);

const MDXComponents = {
  CH,
  a: CustomLink,
  h1: H1,
  h2: H2,
  h3: H3,
  img: ImageComponent,
};

export default MDXComponents;
