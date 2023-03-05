import { GetServerSideProps } from "next";
import { Post, RandomMusing } from "@/lib/types";
import { sanityClient } from "@/lib/sanity-server";
import { postsQuery } from "@/lib/queries";
import { HOST_URL } from "@/config";

const generateSiteMap = (
  slugs: string[]
) => `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
     ${slugs
       .map((slug) => {
         return `
           <url>
            <loc>${`${HOST_URL}/${slug}`}</loc>
            <changefreq>weekly</changefreq>
            <priority>1.0</priority>
           </url>
        `;
       })
       .join("")}
   </urlset>
 `;

const SiteMap = () => {
  // getServerSideProps will do the heavy lifting
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // We make an API call to gather the URLs for our site
  const posts: Post[] = await sanityClient.fetch(postsQuery);
  const randomMusings: RandomMusing[] = await fetch(
    "https://raw.githubusercontent.com/ruchernchong/random-musings/main/feed.json"
  ).then((res) => res.json());

  const pages = [
    ...["", "about", "random-musings"],
    ...posts.map(({ slug }) => `blog/${slug}`),
    ...randomMusings.map(({ slug }) => `random-musings/${slug}`),
  ];

  // We generate the XML sitemap with the page slugs
  const sitemap = generateSiteMap(pages);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default SiteMap;
