import Head from "next/head";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "./Footer";

import { HOST_URL } from "@/config";

const Layout = (props) => {
  const { children, ...customMeta } = props;
  const router = useRouter();
  const meta = {
    title: "Ru Chern",
    description:
      "Frontend developer with believe that using technology, we are able to change how the way we automate things to make living more efficient and smarter.",
    author: "Ru Chern Chong",
    image: `${HOST_URL}/cover-image.png`,
    type: "website",
    ...customMeta,
  };

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="robots" content="follow, index" />
        <meta name="description" content={meta.description} />
        <meta name="author" content={meta.author} />
        <meta property="og:url" content={`${HOST_URL}${router.asPath}`} />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content="Ru Chern" />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ruchernchong" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        {meta.date && (
          <meta property="article:published_time" content={meta.date} />
        )}
        <link rel="canonical" href={`${HOST_URL}${router.asPath}`} />
      </Head>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4">{children}</main>
      <Footer />
    </>
  );
};

export default Layout;
