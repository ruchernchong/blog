import { Head, Html, Main, NextScript } from "next/document";
import { HOST_URL } from "config";

const Document = () => (
  <Html lang="en">
    <Head>
      <link
        rel="alternate"
        type="application/rss+xml"
        title="RSS feed for ruchern.xyz"
        href={`${HOST_URL}/feed.xml`}
      />
    </Head>
    <body className="bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50">
      <Main />
      <NextScript />
    </body>
  </Html>
);

export default Document;
