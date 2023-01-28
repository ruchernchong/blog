import { GetServerSideProps } from "next";
import RSS from "rss";
import { HOST_URL } from "lib/config";
import { Post } from "lib/types";
import { sanityClient } from "lib/sanity-server";
import { indexQuery } from "lib/queries";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const feed = new RSS({
    title: "Ru Chern",
    site_url: HOST_URL,
    feed_url: `${HOST_URL}/feed.xml`
  });

  const posts: Post[] = await sanityClient.fetch(indexQuery);

  posts.map(async (post) =>
    feed.item({
      title: post.title,
      url: `${HOST_URL}/blog/${post.slug}`,
      date: post.publishedDate,
      description: post.excerpt,
      custom_elements: [
        {
          "content:encoded": {
            _cdata: post.content
          }
        }
      ]
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
    props: {}
  };
};

export default function RSSFeed() {
  return null;
}
