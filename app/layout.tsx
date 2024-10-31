import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import classNames from "classnames";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BASE_URL } from "@/config";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

const title = {
  default: "Ru Chern",
  template: "%s | Ru Chern",
};
const description =
  "Frontend Developer from Singapore. Interested in automating workflows and building in React, Node, and Typescript.";
const url = new URL(BASE_URL);

export const metadata: Metadata = {
  metadataBase: url,
  title,
  description,
  robots: {
    index: true,
    follow: true,
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
    title,
    description,
    creator: "@ruchernchong",
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

const RootLayout = ({ children }: { children: ReactNode }) => {
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
          src="https://analytics.ruchern.dev/script.js"
          data-website-id="23a07b6c-093c-4831-840e-9d2998eba9e9"
        />
      </body>
    </html>
  );
};

export default RootLayout;
