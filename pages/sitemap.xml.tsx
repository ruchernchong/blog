const generateSiteMap = (posts) => `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${posts
       .map(({ slug }) => {
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

export const getServerSideProps = async ({ res }) => {
  // We make an API call to gather the URLs for our site
  const request = await fetch(
    "https://dev.to/api/articles?username=ruchernchong"
  );
  const posts = await request.json();

  // We generate the XML sitemap with the posts data
  const sitemap = generateSiteMap(posts);

  res.setHeader("Content-Type", "text/xml");
  // we send the XML to the browser
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default SiteMap;
