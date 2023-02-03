import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import "styles/globals.css";
import "nprogress/nprogress.css";
import NProgress from "nprogress";

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleRouteStart = () => NProgress.start();
    const handleRouteDone = () => NProgress.done();

    router.events.on("routeChangeStart", handleRouteStart);
    router.events.on("routeChangeComplete", handleRouteDone);
    router.events.on("routeChangeError", handleRouteDone);

    return () => {
      router.events.off("routeChangeStart", handleRouteStart);
      router.events.off("routeChangeComplete", handleRouteDone);
      router.events.off("routeChangeError", handleRouteDone);
    };
  }, []);

  return (
    <ThemeProvider attribute="class">
      <Component {...pageProps} key={router.asPath} />
      <Analytics />
    </ThemeProvider>
  );
};

export default App;
