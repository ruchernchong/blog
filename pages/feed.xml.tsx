import { GetServerSideProps } from "next";
import RSS from "rss";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const feed = new RSS({
    title: "Ru Chern",
    site_url: "https://ruchern.xyz",
    feed_url: "https://ruchern.xyz/rss.xml",
  });

  const posts = await fetch("https://dev.to/api/articles/me", {
    headers: {
      "api-key": process.env.DEV_TO_API_KEY,
    },
  }).then((res) => res.json());

  posts.map((post) => {
    feed.item({
      title: post.title,
      url: `https://ruchern.xyz/${post.slug}`,
      date: post.published_at,
      description: post.description,
    });
  });

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
