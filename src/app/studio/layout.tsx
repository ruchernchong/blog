import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/app/studio/providers";
import { UserMenu } from "@/components/auth/user-menu";

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
  return (
    <Providers>
      <div className="min-h-screen">
        <header className="border-b bg-white">
          <div className="container mx-auto flex items-center justify-between p-4">
            <h1 className="font-bold text-xl">Content Studio</h1>
            <UserMenu />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </Providers>
  );
}
