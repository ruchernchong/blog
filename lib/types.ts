import { MDXRemoteSerializeResult } from "next-mdx-remote";

export type Post = {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  publishedDate: string;
  mdxSource?: MDXRemoteSerializeResult;
  readingTime?: string;
  previous?: Pick<Post, "title" | "slug">;
  next?: Pick<Post, "title" | "slug">;
};

export type RandomMusing = {
  content: string;
  date: string;
  slug: string;
  title: string;
};
