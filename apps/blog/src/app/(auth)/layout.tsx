import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import type { ReactNode } from "react";
import { BASE_URL, SITE_NAME } from "@/config";
import { cn } from "@/lib/utils";
import "@/app/(blog)/styles.css";

const geist = Geist({ subsets: ["latin"] });

const url = new URL(BASE_URL);

export const metadata: Metadata = {
  metadataBase: url,
  title: {
    default: "Sign In",
    template: `%s - ${SITE_NAME}`,
  },
  description: "Sign in to access your account",
  robots: {
    index: false,
    follow: false,
  },
};

const AuthLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html lang="en" className={cn("scroll-smooth", geist.className)}>
      <body className="bg-background text-foreground">
        <ViewTransitions>{children}</ViewTransitions>
      </body>
    </html>
  );
};

export default AuthLayout;
