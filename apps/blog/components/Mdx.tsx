import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMDXComponent } from "next-contentlayer2/hooks";
import type { MDXComponents } from "mdx/types";
import { ArrowUpRightIcon } from "@heroicons/react/16/solid";
import { Typography } from "@/components/Typography";

const CustomLink = ({ href, children, ...props }: any) => {
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));

  if (isInternalLink) {
    return (
      <Link
        href={href}
        className="text-pink-500 hover:text-pink-300"
        data-umami-event="internal-link-click"
        data-umami-event-destination={href}
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
      className="text-pink-500 hover:text-pink-300"
      data-umami-event="external-link-click"
      data-umami-event-destination={href}
      {...props}
    >
      <span>
        {children}
        <ArrowUpRightIcon className="inline-flex h-4 w-4 align-super" />
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
        data-umami-event="image-view"
        data-umami-event-alt={alt}
        {...props}
      />
    </Suspense>
    {alt && (
      <figcaption className="text-center text-xs font-bold text-zinc-50 italic">
        {alt}
      </figcaption>
    )}
  </figure>
);

const components: MDXComponents = {
  a: CustomLink,
  h1: (props) => (
    <Typography
      variant="h1"
      data-umami-event="heading-view"
      data-umami-event-level="h1"
      {...props}
    />
  ),
  h2: (props) => (
    <Typography
      variant="h2"
      className="mt-24 text-3xl text-yellow-400"
      data-umami-event="heading-view"
      data-umami-event-level="h2"
      {...props}
    />
  ),
  h3: (props) => (
    <Typography
      variant="h3"
      className="mt-16 text-2xl"
      data-umami-event="heading-view"
      data-umami-event-level="h3"
      {...props}
    />
  ),
  img: ImageComponent,
};

export const Mdx = ({ code }: { code: string }) => {
  const Component = useMDXComponent(code);

  return (
    <div data-umami-event="mdx-content-view">
      <Component components={components} />
    </div>
  );
};
