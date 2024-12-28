import { truncate } from "@/utils/truncate";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import readingTime from "reading-time";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkUnwrapImages from "remark-unwrap-images";
import type { BlogPosting, WithContext } from "schema-dts";
import { BASE_URL } from "./config";
// import rehypePrettyCode, {
//   type Options as PrettyCodeOptions,
// } from "rehype-pretty-code";

import { randomUUID } from "node:crypto";

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "posts/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    publishedAt: { type: "date", required: true },
    excerpt: { type: "string", required: true },
    featured: { type: "boolean" },
    image: { type: "string" },
  },
  computedFields: {
    id: {
      type: "string",
      resolve: () => randomUUID(),
    },
    readingTime: {
      type: "string",
      resolve: (post) => readingTime(post.body.raw).text,
    },
    slug: {
      type: "string",
      resolve: (post) => {
        const [_, slug] = post._raw.flattenedPath.split("/");
        return slug;
      },
    },
    structuredData: {
      type: "json",
      resolve: (post) =>
        ({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          dateModified: post.publishedAt,
          datePublished: post.publishedAt,
          description: truncate(post.excerpt),
          image: [
            post.image
              ? encodeURI(`${BASE_URL}/${post.image}`)
              : encodeURI(`${BASE_URL}/og?title=${post.title}`),
          ],
          url: `${BASE_URL}/${post._raw.flattenedPath}`,
          author: {
            "@type": "Person",
            name: "Ru Chern Chong",
            url: BASE_URL,
          },
        }) satisfies WithContext<BlogPosting>,
    },
    url: {
      type: "string",
      resolve: (post) => `/${post._raw.flattenedPath}`,
    },
  },
}));

export const Note = defineDocumentType(() => ({
  name: "Note",
  filePathPattern: "notes/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    publishedAt: { type: "date", required: true },
    excerpt: { type: "string" },
    image: { type: "string" },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (note) => {
        const [_, slug] = note._raw.flattenedPath.split("/");
        return slug;
      },
    },
    structuredData: {
      type: "json",
      resolve: (note) =>
        ({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: note.title,
          dateModified: note.publishedAt,
          datePublished: note.publishedAt,
          description: note.title,
          image: [
            note.image
              ? encodeURI(`${BASE_URL}/${note.image}`)
              : encodeURI(`${BASE_URL}/og?title=${note.title}`),
          ],
          url: `${BASE_URL}/${note._raw.flattenedPath}`,
          author: {
            "@type": "Person",
            name: "Ru Chern Chong",
            url: BASE_URL,
          },
        }) satisfies WithContext<BlogPosting>,
    },
    url: {
      type: "string",
      resolve: (note) => `/${note._raw.flattenedPath}`,
    },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Note],
  mdx: {
    remarkPlugins: [remarkGfm, remarkUnwrapImages],
    rehypePlugins: [
      rehypeSlug,
      // [
      //   rehypePrettyCode,
      //   {
      //     theme: "github-dark-dimmed",
      //   } satisfies PrettyCodeOptions,
      // ],
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
});
