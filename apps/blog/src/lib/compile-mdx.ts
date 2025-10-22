import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkUnwrapImages from "remark-unwrap-images";
import type { MDXComponents } from "mdx/types";

/**
 * Compiles MDX content with configured rehype and remark plugins.
 * Configured to match the plugins previously used in contentlayer.config.ts:
 * - remarkGfm: GitHub Flavored Markdown support
 * - remarkUnwrapImages: Remove paragraph wrapping from images
 * - rehypeSlug: Add IDs to headings
 * - rehypePrettyCode: Syntax highlighting for code blocks
 * - rehypeAutolinkHeadings: Add links to headings
 *
 * @param content - The MDX content string to compile
 * @param components - Optional custom MDX components to use during rendering
 * @returns Compiled MDX content as React elements
 */
export async function compileMDXContent(
  content: string,
  components?: MDXComponents,
) {
  const { content: mdxContent } = await compileMDX({
    source: content,
    components: components || {},
    options: {
      parseFrontmatter: false, // We use database fields instead of frontmatter
      mdxOptions: {
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
    },
  });

  return mdxContent;
}
