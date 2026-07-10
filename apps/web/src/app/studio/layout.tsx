import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudioAccess } from "@/components/studio/studio-access";

export const metadata: Metadata = {
  title: "Content Studio | Manage Blog Posts",
  description: "Create and manage your blog posts with a built-in CMS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <StudioAccess>{children}</StudioAccess>;
}
