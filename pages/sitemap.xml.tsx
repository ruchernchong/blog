import { GetServerSideProps } from "next";
import { Post } from "lib/types";
import { sanityClient } from "lib/sanity-server";
import { indexQuery } from "lib/queries";

const generateSiteMap = (
  slugs: string[]
) => `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${slugs
       .map((slug) => {
         return `
           <url>
               <loc>${`https://ruchern.xyz/${slug}`}</loc>
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
  const posts: Post[] = await sanityClient.fetch(indexQuery);
  // const randomMusings = fs.readdirSync("data/random-musings");

  const pages = [
    ...["", "about", "random-musings"],
    ...posts.map(({ slug }) => `blog/${slug}`),
    // ...randomMusings.map(
    //   (randomMusing) => `random-musings/${randomMusing.replace(".md", "")}`
    // ),
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
