import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from "@/config";
import { cn } from "@/lib/utils";
import "@/app/globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={cn("scroll-smooth", figtree.variable)}>
      <body
        className={cn(
          "bg-background text-foreground antialiased",
          geistMono.variable,
        )}
      >
        <NuqsAdapter>{children}</NuqsAdapter>
        <VercelAnalytics />
        <SpeedInsights />
        <Script
          defer
          src="https://umami.ruchern.dev/script.js"
          data-website-id="23a07b6c-093c-4831-840e-9d2998eba9e9"
          data-domains="ruchern.dev"
        />
      </body>
    </html>
  );
}
