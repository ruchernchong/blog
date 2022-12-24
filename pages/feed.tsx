import { GetServerSideProps } from "next";
import RSS from "rss";
import { HOST_URL } from "lib/config";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const feed = new RSS({
    title: "Ru Chern",
    site_url: HOST_URL,
    feed_url: `${HOST_URL}/feed`,
  });

  const posts = await fetch("https://dev.to/api/articles/me", {
    headers: {
      "api-key": process.env.DEV_TO_API_KEY,
    },
  }).then((res) => res.json());

  posts.map((post) => {
    feed.item({
      title: post.title,
      url: `${HOST_URL}/${post.slug}`,
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
