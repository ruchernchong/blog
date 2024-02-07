import { defineDocumentType, makeSource } from "contentlayer/source-files";
import type { BlogPosting, WithContext } from "schema-dts";
import { BASE_URL } from "./config";
import readingTime from "reading-time";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkUnwrapImages from "remark-unwrap-images";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    publishedAt: { type: "date", required: true },
    excerpt: { type: "string", required: true },
    featured: { type: "boolean" },
    image: {
      type: "string",
    },
  },
  computedFields: {
    readingTime: {
      type: "string",
      resolve: (post) => readingTime(post.body.raw).text,
    },
    slug: {
      type: "string",
      resolve: (post) => post._raw.flattenedPath,
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
          description: post.excerpt,
          image: [
            post.image
              ? encodeURI(`${BASE_URL}/${post.image}`)
              : encodeURI(`${BASE_URL}/og?title=${post.title}`),
          ],
          url: `${BASE_URL}/posts/${post._raw.flattenedPath}`,
          author: {
            "@type": "Person",
            name: "Ru Chern Chong",
            url: BASE_URL,
          },
        } satisfies WithContext<BlogPosting>),
    },
    url: {
      type: "string",
      resolve: (post) => `/posts/${post._raw.flattenedPath}`,
    },
  },
}));

export const Journal = defineDocumentType(() => ({
  name: "Journal",
  filePathPattern: `journals/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    publishedAt: { type: "date", require: true },
    excerpt: { type: "string" },
    image: { type: "string" },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (journal) => journal._raw.flattenedPath,
    },
    structuredData: {
      type: "json",
      resolve: (journal) =>
        ({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: journal.title,
          dateModified: journal.publishedAt,
          datePublished: journal.publishedAt,
          description: journal.title,
          image: [
            journal.image
              ? encodeURI(`${BASE_URL}/${journal.image}`)
              : encodeURI(`${BASE_URL}/og?title=${journal.title}`),
          ],
          url: `${BASE_URL}/${journal._raw.flattenedPath}`,
          author: {
            "@type": "Person",
            name: "Ru Chern Chong",
            url: BASE_URL,
          },
        } satisfies WithContext<BlogPosting>),
    },
    url: {
      type: "string",
      resolve: (journal) => `/${journal._raw.flattenedPath}`,
    },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Journal, Post],
  mdx: {
    remarkPlugins: [remarkGfm, remarkUnwrapImages],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: "github-dark-dimmed",
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
});
