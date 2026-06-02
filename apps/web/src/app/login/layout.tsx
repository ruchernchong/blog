import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to access your account",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
