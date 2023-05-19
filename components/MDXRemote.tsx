import { MDXRemote as CustomMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { remarkCodeHike } from "@code-hike/mdx";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import theme from "shiki/themes/github-dark.json";
import MDXComponents from "@/components/MDXComponents";
import "@code-hike/mdx/dist/index.css";

const MDXRemote = (props) => {
  return (
    <>
      {/*TODO: This is not a proper and permanent solution*/}
      {/*@ts-expect-error Server Component*/}
      <CustomMDX
        {...props}
        components={MDXComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [
              remarkGfm,
              // [
              //   remarkCodeHike,
              //   {
              //     autoImport: false,
              //     lineNumbers: true,
              //     showCopyButton: true,
              //     theme,
              //   },
              // ],
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
        }}
      />
    </>
  );
};

export default MDXRemote;
