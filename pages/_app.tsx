import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import "styles/globals.css";
import { AnimatePresence } from "framer-motion";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <ThemeProvider attribute="class">
      <AnimatePresence mode="wait" initial={false}>
        <Component {...pageProps} key={router.asPath} />
      </AnimatePresence>
      <Analytics />
    </ThemeProvider>
  );
}
