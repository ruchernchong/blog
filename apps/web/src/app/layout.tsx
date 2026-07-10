import { PostHogPageView, PostHogProvider } from "@posthog/next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from "@/config";
import "@/app/globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const title = {
  default: "Ru Chern — Software Developer",
  template: `%s - ${SITE_NAME}`,
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
    <html lang="en" className={`scroll-smooth ${figtree.variable}`}>
      <body
        className={`bg-background text-foreground antialiased ${geistMono.variable}`}
      >
        <PostHogProvider
          apiKey={process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}
          clientOptions={{ api_host: "/ingest" }}
        >
          <PostHogPageView />
          {children}
          <VercelAnalytics />
          <SpeedInsights />
        </PostHogProvider>
      </body>
    </html>
  );
}
