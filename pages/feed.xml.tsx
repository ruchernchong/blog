import { GetServerSideProps } from "next";
import { allPosts, Post } from "contentlayer/generated";
import RSS from "rss";
import { HOST_URL } from "@/config";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const feed = new RSS({
    title: "Ru Chern",
    site_url: HOST_URL,
    feed_url: `${HOST_URL}/feed.xml`,
  });

  allPosts.map(({ title, slug, publishedAt, excerpt }) =>
    feed.item({
      title,
      url: `${HOST_URL}/${slug}`,
      date: publishedAt,
      description: excerpt,
    })
  );

  res.setHeader("Content-Type", "text/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=1200, stale-while-revalidate=600"
  );
  res.write(feed.xml({ indents: true }));
  res.end();

  return {
    props: {},
  };
};

export default function RSSFeed() {
  return null;
}
