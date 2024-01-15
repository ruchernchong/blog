import { ReactNode } from "react";
import { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BASE_URL } from "@/config";
import "@/app/globals.css";

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
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
      />
      <Script id="google-analytics">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', '${gaMeasurementId}');
        `}
      </Script>
      <body className="bg-gray-900 text-gray-50">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="mx-auto my-8 w-screen max-w-4xl grow px-4 md:my-16">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
