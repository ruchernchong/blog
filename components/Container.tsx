import Head from "next/head";
import { useRouter } from "next/router";
import NextLink from "next/link";
import Footer from "./Footer";

const NavItem = ({ href, title }) => {
  const router = useRouter();
  const isActive = router.asPath === href;

  return (
    <NextLink href={href}>
      <span>{title}</span>
    </NextLink>
  );
};

export default function Container(props) {
  const { children, ...customMeta } = props;
  const router = useRouter();
  const meta = {
    title: "Ru Chern - Developer, Investor, Author",
    description: "Frontend developer",
    image: "",
    type: "website",
    ...customMeta,
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900">
      <Head>
        <title>{meta.title}</title>
        <meta name="robots" content="follow, index" />
        <meta content={meta.description} name="description" />
        <meta
          property="og:url"
          content={`https://ruchern.xyz${router.asPath}`}
        />
        <link rel="canonical" href={`https://ruchern.xyz${router.asPath}`} />
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
      </Head>
      <div className="max-w-2xl mx-auto p-8 mb-8">
        <nav className="flex justify-between items-center">
          <NavItem href="/" title="Home" />
        </nav>
      </div>
      <main className="max-w-2xl mx-auto px-8">
        {children}
        <Footer />
      </main>
    </div>
  );
}
