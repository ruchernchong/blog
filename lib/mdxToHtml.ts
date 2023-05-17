import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkCodeHike } from "@code-hike/mdx";
import theme from "shiki/themes/github-dark.json";

export const mdxToHtml = async (content: string) => {
  return serialize(content, {
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
        [
          remarkCodeHike,
          { autoImport: false, lineNumbers: true, showCopyButton: true, theme },
        ],
      ],
      rehypePlugins: [
        rehypeSlug,
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
      useDynamicImport: true,
    },
  });
};
