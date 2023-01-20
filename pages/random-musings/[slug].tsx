import fs from "fs";
import path from "path";
import { GetStaticPaths, GetStaticProps } from "next";
import Layout from "components/Layout";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { format, parseISO } from "date-fns";
import { HOST_URL } from "lib/config";

const RandomMusingsPage = ({ frontmatter, content }) => {
  const ogImageUrlParams = {
    title: frontmatter.title,
    date: format(parseISO(frontmatter.date), "dd MMMM yyyy"),
  };
  const urlParams = Object.entries(ogImageUrlParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const ogImageUrl = encodeURI(`${HOST_URL}/api/og?${urlParams}`);

  return (
    <Layout
      title={`${frontmatter.title} - Ru Chern`}
      description="A collection containing fun and interesting things I came across randomly"
      image={ogImageUrl}
      date={frontmatter.date}
      type="article"
    >
      <article className="prose mx-auto mb-6 max-w-4xl prose-img:rounded-2xl dark:prose-invert">
        <MDXRemote {...content} />
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  const randomMusings = fs.readdirSync(path.resolve("data/random-musings"));

  return {
    paths: randomMusings.map((file) => ({
      params: { slug: file.replace(".md", "") },
    })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const file = fs.readFileSync(
    path.resolve(`data/random-musings/${params.slug}.md`),
    "utf-8"
  );
  const mdxSource = await serialize(file, {
    parseFrontmatter: true,
  });
  const { frontmatter } = mdxSource;

  return {
    props: {
      frontmatter,
      content: mdxSource,
    },
  };
};

export default RandomMusingsPage;
