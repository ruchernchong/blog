import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import type { ReactNode } from "react";
import { Providers } from "@/app/(studio)/providers";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";
import "@/app/(blog)/globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Content Studio | Manage Blog Posts",
  description: "Create and manage your blog posts with a built-in CMS",
  robots: {
    index: false,
    follow: false,
  },
};

const StudioLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html lang="en" className={cn("scroll-smooth", figtree.variable)}>
      <body
        className={cn(
          "bg-background text-foreground antialiased",
          geistMono.variable,
        )}
      >
        <ViewTransitions>
          <Providers>
            <div className="min-h-screen">
              <header className="border-b bg-white">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                  <h1 className="font-bold text-xl">Content Studio</h1>
                  <UserMenu />
                </div>
              </header>
              <main className="container mx-auto px-4 py-8">{children}</main>
            </div>
          </Providers>
        </ViewTransitions>
      </body>
    </html>
  );
};

export default StudioLayout;
