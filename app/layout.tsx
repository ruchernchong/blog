import { ReactNode } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import globalMetadata from "@/app/metadata";
import { ThemeProvider } from "@/app/ThemeProvider";
import { HOST_URL } from "@/config";

import "@/app/globals.css";

export const metadata = globalMetadata;

const RootLayout = ({ children }: { children: ReactNode }) => {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <link
        rel="alternate"
        type="application/rss+xml"
        title="RSS feed for ruchern.xyz"
        href={`${HOST_URL}/feed.xml`}
      />
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
      <body className="bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50">
        <ThemeProvider attribute="class" defaultTheme="dark">
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="mx-auto my-8 w-screen max-w-4xl grow px-4 md:my-16">
              {children}
              <Analytics />
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
