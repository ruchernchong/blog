import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from "@/config";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import classNames from "classnames";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

const title = {
  default: "Home",
  template: `%s - ${SITE_NAME}`,
  absolute: `Home - ${SITE_NAME}`,
};
const description = SITE_DESCRIPTION;
const url = new URL(BASE_URL);

export const metadata: Metadata = {
  metadataBase: url,
  title,
  description,
  // Enhanced robots directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title,
    description,
    url,
    siteName: title.default,
    locale: "en_SG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ruchernchong",
    title,
    description,
    creator: "@ruchernchong",
  },
  alternates: {
    canonical: "/",
    languages: {
      "x-default": url.toString(),
      "en-SG": url.toString(),
      en: url.toString(),
    },
  },
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" className={classNames("scroll-smooth", inter.className)}>
      <body className="bg-gray-900 text-gray-50">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="mx-auto my-8 w-screen max-w-4xl grow px-4 md:my-16">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
        <Script
          defer
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="IbuEg0lrqdkez2MoPQhVXQ"
        />
        <Script
          defer
          src="https://analytics.ruchern.dev/script.js"
          data-website-id="23a07b6c-093c-4831-840e-9d2998eba9e9"
          data-domains="ruchern.dev"
        />
        <Script
          defer
          data-site-id="ruchern.dev"
          src="https://assets.onedollarstats.com/tracker.js"
        />
      </body>
      <GoogleAnalytics gaId="G-RM5T37E098" />
    </html>
  );
};

export default RootLayout;
