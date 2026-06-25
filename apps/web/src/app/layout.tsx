import { PostHogPageView, PostHogProvider } from "@posthog/next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist_Mono, Hanken_Grotesk, Space_Grotesk } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/app/components/theme-provider";
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from "@/config";
import "@/app/globals.css";

// Engineering Notebook type roles
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
}); // display
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
}); // body
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
}); // chrome + data

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`scroll-smooth ${spaceGrotesk.variable} ${hanken.variable} ${geistMono.variable}`}
    >
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <PostHogProvider
            apiKey={process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}
            clientOptions={{ api_host: "/ingest" }}
          >
            <PostHogPageView />
            <NuqsAdapter>{children}</NuqsAdapter>
            <VercelAnalytics />
            <SpeedInsights />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
